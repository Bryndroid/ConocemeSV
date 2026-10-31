import { Component, computed, inject, OnDestroy, AfterViewInit, signal, ViewChild } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Map } from '../../shared/map/map';
import { CardGeneric } from '../../shared/card-generic/card-generic';
import { MatTab, MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';
import { UserRoute } from '../../types/route';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatTreeModule } from '@angular/material/tree';
import { MapService } from '../../services/map.service';
import { CardForm } from '../../shared/card-form/card-form';
import { RouteMarker } from '../../types/routeMarker';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { PlaceEditDialog } from '../../shared/card-form/place-edit-dialog';
import { StorageService } from '../../services/storage.service';
import { MAPS_MARKERS } from '../../store/Tools';
//Aclaracion importante:
//Tengo los marcadores, para asegurar de que me agregue marcadores al mapa
//Luego tengo los lugares, que son parte de los marcadores y dan mas informacion acerca de ese marcador
type RoutePlace = UserRoute['places'][number];

interface MarkerPlace {
  markerId: string;
  place: RoutePlace;
}
//Validator dinamico para las places
const completePlaces: ValidatorFn = (control) => {
  const entries = control.value as MarkerPlace[];
  const isComplete = entries.length > 0 && entries.every(({ place }) =>
    Boolean(
      place.name.trim() &&
      place.description.trim() &&
      place.location.trim() &&
      place.bestHourVisit.trim() &&
      place.bestDayVisit.trim(),
    ) &&
    Number.isFinite(place.budget) &&
    place.budget >= 0,
  );

  return isComplete ? null : { incompletePlaces: true };
};

//Validator dinamico (queria probarlos)
const notBlank: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '');

  return value.trim().length > 0 ? null : { blank: true };
};

//Para los trees
export interface TreeTools {
  title: string,
  type?: string,
  icon?: string,
  color?: string,
  children?: TreeTools[]
}


@Component({
  imports: [MatButtonModule, MatToolbarModule, Map, CardGeneric, CardForm, MatTabsModule, MatTab, MatStepperModule, MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatTreeModule, MatSelectModule],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements AfterViewInit, OnDestroy {

  //Referencia directa del componente map (este nombre me dio muchos problemas...)
  @ViewChild('tourMap') mapComponent!: Map;
  //Injeccion de sercicios.
  private readonly storage = inject(StorageService);
  readonly currentUser = this.storage.getCurrentUser();
  readonly routes = signal(this.storage.getAllRoutes());
  readonly myRoutes = this.currentUser?.turisticRoutes ?? [];
  //Sistema de estrellas (Proxima implementacion)
  readonly rankedRoutes = computed(() =>
    [...this.routes()].sort((first, second) => (second.star ?? 0) - (first.star ?? 0))
  );
  public flagsUI = {
    currentStep: 'stepOne',
    routeCreate: {
      stepOne: true,
      stepTwo: false,
      stepThree: false,
      finish: false,
    }
  }
  //Categorias existentes en el sistema.
  readonly routeCategories: { value: UserRoute['category']; label: string }[] = [
    { value: 'aventura', label: 'Aventura' },
    { value: 'gastronomico', label: 'Gastronómica' },
    { value: 'colonial', label: 'Colonial' },
  ];
  //TOOLS para ocupar
  readonly renderTools = MAPS_MARKERS;
  //SERVICES
  readonly mapService = inject(MapService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  //Route default
  userRoute: UserRoute = {
    id: 0,
    category: 'aventura',
    title: "",
    description: "",
    autor: "",
    places: [],
    totalTimeCar: 0,
    totalDistance: 0,
    traveled: 0,
    placesVisited: [],
    percentage: 0,
    star: 0
  };
  //FORM VALIDATORS PARA EL MAP TREE
  readonly routeForm = this.fb.nonNullable.group({
    category: this.fb.nonNullable.control<UserRoute['category']>('aventura', Validators.required),
    title: ['', [
      Validators.required,
      notBlank,
      Validators.minLength(3),
      Validators.maxLength(80),
    ]],
    description: ['', [
      Validators.required,
      notBlank,
      Validators.minLength(10),
      Validators.maxLength(500),
    ]],
  });
  //FORM VALIDATORS para el mapa de marcadores
  readonly markersForm = this.fb.nonNullable.control(false, Validators.requiredTrue);
  //FORM VALIDATORS PARA LOS PLACES
  readonly placesForm = this.fb.nonNullable.control<MarkerPlace[]>([], [
    Validators.required,
    completePlaces,
  ]);

  //Config para el MapTree (Config de Angular Material)
  childrenAccessor = (node: TreeTools) => node.children ?? [];
  hasChild = (_: number, node: TreeTools) => !!node.children && node.children.length > 0;

  //Estado del Componente
  ngAfterViewInit(): void {
    //Importante darle referencia a mi servicio de mapa del componente map que tengo.
    this.mapService.setMapReference(this.mapComponent);
    //Inicializo los marcadores
    this.syncPlacesWithMarkers();
  }
  //Importante limpiar la referencia.
  ngOnDestroy(): void {
    this.mapService.clearMapReference(this.mapComponent);
  }
  //Funciones para binding de data para el map
  onMarkerDeleteRequested(id: string): void {
    this.mapService.deleteMarker(id);
    this.syncPlacesWithMarkers();
  }

  onMarkerEditRequested(id: string): void {
    const marker = this.mapService.getMarker(id);
    const place = this.getPlaceForMarker(id);
    if (!marker || !place) {
      return;
    }

    this.dialog
      .open(PlaceEditDialog, {
        width: 'min(640px, 95vw)',
        data: place,
      })
      .afterClosed()
      .subscribe((updatedPlace: RoutePlace | undefined) => {
        if (updatedPlace) {
          this.updatePlace(id, updatedPlace);
        }
      });
  }

  onMarkerPositionChanged(position: { id: string; lat: number; lng: number }): void {
    this.mapService.updateMarker(position.id, {
      lat: position.lat,
      lng: position.lng,
    });
  }
  //Registro de avance en el MapTree
  onStepSelectionChange(event: StepperSelectionEvent): void {
    const steps = ['stepOne', 'stepTwo', 'stepThree', 'finish'] as const;
    const activeStep = steps[event.selectedIndex] ?? 'stepOne';

    this.flagsUI.currentStep = activeStep;
    this.flagsUI.routeCreate = {
      stepOne: activeStep === 'stepOne',
      stepTwo: activeStep === 'stepTwo',
      stepThree: activeStep === 'stepThree',
      finish: activeStep === 'finish',
    };
  }

  get categoryLabel(): string {
    return this.routeCategories.find(
      (category) => category.value === this.routeForm.controls.category.value,
    )?.label ?? 'Aventura';
  }

  routesForCategory(category: UserRoute['category']): UserRoute[] {
    return this.routes().filter((route) => route.category === category);
  }

  // ==== HANDLERS PARA LOS PASOS DEL MATSTEPPER ====

  //Handler para el form del paso uno.
  onSubmit() {
    if (this.routeForm.invalid) {
      this.routeForm.markAllAsTouched();
      return;
    }

    this.userRoute = {
      ...this.userRoute,
      category: this.routeForm.controls.category.value,
      autor: `${this.currentUser?.firstName ?? ''} ${this.currentUser?.lastName ?? ''}`.trim(),
      description: this.routeForm.controls.description.value,
      title: this.routeForm.controls.title.value,
    };
  }
  //Handler cuando se seleccione herramienta del paso dos(Llenara los marcadores y los places)
  selectTool(node: TreeTools): void {
    if (node.type === 'marker') {
      const { lat, lng } = this.mapService.getCenterCoordinates();
      const icon = node.icon as string;
      this.mapService.addDraggableMarker(lat, lng, node.title, '', icon, node.color);
      //Automaticamente creo los marcadores y adjunto un place por default. El estado de los places lo manejo por aca con Signals.
      this.syncPlacesWithMarkers();
    }
  }

  //Actualizar el contenido del lugar dado un update por medio del cardform o del paso dos del maptree. Paso tres o dos (dependiendo de que haga el usuario)
  updatePlace(markerId: string, place: RoutePlace): void {
    this.mapService.updateMarker(markerId, {
      title: place.name,
      description: place.description,
      icon: place.icon,
    });
    this.placesForm.setValue(
      this.placesForm.value.map((entry) =>
        entry.markerId === markerId ? { markerId, place } : entry,
      ),
    );
  }

  //Finalizacion de los pasos para crear ruta. Se crea la ruta y se guarda en el localstorage con el service de storage
  finishRoute(): void {
    if (this.routeForm.invalid || this.placesForm.invalid) {
      this.routeForm.markAllAsTouched();
      this.placesForm.markAsTouched();
      return;
    }

    const newRoute = this.storage.newRoute({
      category: this.routeForm.controls.category.value,
      title: this.routeForm.controls.title.value.trim(),
      description: this.routeForm.controls.description.value.trim(),
      places: this.placesForm.value.map(({ place }) => place),
      totalTimeCar: 0,
      totalDistance: 0,
      traveled: 0,
      placesVisited: [],
      percentage: 0
    });
    if (!newRoute) {
      return;
    }

    this.userRoute = newRoute;
    this.routes.update((routes) => [...routes, newRoute]);
    alert("Ruta creada exitosamente");
    location.reload();
  }

  // === FUNCIONES AUXILIARES ===

  getPlaceForMarker(markerId: string): RoutePlace | undefined {
    return this.placesForm.value.find((entry) => entry.markerId === markerId)?.place;
  }

  //Actualizacion de los marcadores y de los lugares
  private syncPlacesWithMarkers(): void {
    //Veo si existe una referencia de places para este marcador (lo normal es que no, pero me daba error.)
    const currentPlaces = new globalThis.Map(
      this.placesForm.value.map((entry) => [entry.markerId, entry.place]),
    );
    const markerPlaces = this.mapService.getMarkers().map((marker) => ({
      markerId: marker.id,
      place: currentPlaces.get(marker.id) ?? this.createPlaceFromMarker(marker),
    }));

    this.placesForm.setValue(markerPlaces);
    this.markersForm.setValue(markerPlaces.length > 0);
  }
  //Data default para un place de cualquier marcador
  private createPlaceFromMarker(marker: RouteMarker): RoutePlace {
    return {
      name: marker.title,
      description: marker.description,
      location: '',
      budget: 0,
      hasPeople: 'low',
      weather: 'nublado',
      bestHourVisit: '',
      bestDayVisit: '',
      icon: marker.icon as string,
    };
  }



}

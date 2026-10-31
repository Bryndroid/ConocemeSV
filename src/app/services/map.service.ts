import { Injectable, signal, Service} from '@angular/core';

import { RouteMarker } from '../types/routeMarker';
import { Map } from '../shared/map/map';

type MarkerChanges = Partial<Omit<RouteMarker, 'id' | 'order'>>; //Omito info que no necesito
//Service para manejar la logica de acceso a las propiedades que expone el componente map y manejar un estado de los marcadores con Signals .
@Service()
export class MapService {
  private mapComponent?: Map;
  private readonly markerState = signal<readonly RouteMarker[]>([]);
  readonly markers = this.markerState.asReadonly();

  //Sin esta referencia no existe este sercicio. Dependencia directa
  setMapReference(map: Map): void {
    if (this.mapComponent === map) {
      return;
    }

    this.mapComponent = map;
    for (const marker of this.markerState()) {
      this.renderMarker(marker);
    }
  }

  clearMapReference(map: Map): void {
    if (this.mapComponent === map) {
      this.mapComponent = undefined;
    }
  }
  //=== FUNCIONES CRUD MARKERS ===

  //Agregar un marcador y actualizar mi estado con Signals
  addDraggableMarker(
    lat: number,
    lng: number,
    title: string,
    description: string,
    icon: string,
    color: string = '#a855f7',
  ): RouteMarker {
    const markers = this.markerState();

    const marker: RouteMarker = {
      id: crypto.randomUUID(),
      title,
      description,
      icon,
      color,
      lat,
      lng,
      order: markers.length + 1,
    };

    this.renderMarker(marker);
    this.markerState.set([...markers, marker]);
    return marker;
  }

  getMarkers(): readonly RouteMarker[] {
    return this.markerState();
  }

  getMarker(id: string): RouteMarker | undefined {
    return this.markerState().find((marker) => marker.id === id);
  }

  updateMarker(id: string, changes: MarkerChanges): RouteMarker | undefined {
    const currentMarker = this.getMarker(id);
    if (!currentMarker) {
      return undefined;
    }

    const updatedMarker = { ...currentMarker, ...changes, id: currentMarker.id };
    this.mapComponent?.updateDraggableMarker(updatedMarker);
    this.markerState.update((markers) =>
      markers.map((marker) => marker.id === id ? updatedMarker : marker),
    );

    return updatedMarker;
  }

  deleteMarker(id: string): boolean {
    const markers = this.markerState();
    if (!markers.some((marker) => marker.id === id)) {
      return false;
    }

    this.mapComponent?.removeDraggableMarker(id);
    this.markerState.set(
      markers
        .filter((marker) => marker.id !== id)
        .map((marker, index) => ({ ...marker, order: index + 1 })),
    );
    return true;
  }

  // === FUNCIONES DIRECTAS DEL MAPA LEAFLET ===

  locateUser(): void {
    this.requireMap().locateUser();
  }

  getCenterCoordinates(): { lat: number; lng: number; zoom: number } {
    return this.requireMap().getCenterCoordinates();
  }

  private renderMarker(marker: RouteMarker): void {
    this.mapComponent?.addDraggableMarker(
      marker.lat,
      marker.lng,
      marker.title,
      marker.description,
      marker.icon,
      marker.color,
      marker.id,
    );
  }


  private requireMap(): Map {
    if (!this.mapComponent) {
      throw new Error('El mapa aún no está disponible.');
    }

    return this.mapComponent;
  }
}

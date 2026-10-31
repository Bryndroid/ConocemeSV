import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouteMarker } from '../../types/routeMarker';
import { UserRoute } from '../../types/route';
import { PlaceEditDialog } from './place-edit-dialog';

type RoutePlace = UserRoute['places'][number];

@Component({
  imports: [NgClass, MatButtonModule, MatCardModule, MatDialogModule],
  selector: 'app-card-form',
  templateUrl: './card-form.html',
})
export class  CardForm {
  //Informacion imporante para renderizar correctamente esta carta
  @Input({ required: true }) marker!: RouteMarker;
  @Input({ required: true }) place!: RoutePlace;
  //Para retornar la data que se complete en el matDialog
  @Output() placeChange = new EventEmitter<RoutePlace>();

  private readonly dialog = inject(MatDialog);

  //Obtengo los datos faltantes
  get missingFields(): string[] {
    const missing: string[] = [];
    console.log(this.place);
    console.log(this.marker);
    if (!this.place.name.trim()) missing.push('Nombre');
    if (!this.place.description.trim()) missing.push('Descripción');
    if (!this.place.location.trim()) missing.push('Ubicación');
    if (!this.place.bestDayVisit.trim()) missing.push('Mejor día');
    if (!this.place.bestHourVisit.trim()) missing.push('Mejor hora');

    return missing;
  }


  get isComplete(): boolean {
    return this.missingFields.length === 0;
  }
  //Render del matDialog
  editPlace(): void {
    this.dialog
      .open(PlaceEditDialog, {
        width: 'min(640px, 95vw)',
        data: this.place,
      })
      .afterClosed()
      //Emit del change cuando se complete el form
      .subscribe((place: RoutePlace | undefined) => {
        if (place) {
          this.placeChange.emit(place);
        }
      });
  }
}

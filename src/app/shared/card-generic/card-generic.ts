import { Component, Input } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatTabsModule} from '@angular/material/tabs';
import { UserRoute } from '../../types/route';
import { DecimalPipe } from '@angular/common';

@Component({
  imports: [MatButtonModule, MatCardModule, MatTabsModule, DecimalPipe],
  selector: 'app-card-generic',
  styleUrl: './card-generic.css',
  templateUrl: './card-generic.html',
})
export class CardGeneric {
  isExpanded: boolean = false;

  @Input() UserRoute!: UserRoute;

  get categoryLabel(): string {
    switch (this.UserRoute?.category) {
      case 'aventura':
        return 'Aventura';
      case 'gastronomico':
        return 'Gastronómica';
      case 'colonial':
        return 'Colonial';
      default:
        return 'Ruta';
    }
  }

  get nextPlaceName(): string {
    if (!this.UserRoute) return '';

    // Busca el primer lugar cuyo 'name' no esté en 'placesVisited'
    const nextPlace = this.UserRoute.places.find(
      (place) => !this.UserRoute!.placesVisited.includes(place.name)
    );

    return nextPlace ? nextPlace.name : '';
  }

}

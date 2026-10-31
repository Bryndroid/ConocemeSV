import { Component, AfterViewInit, Input, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import * as L from 'leaflet';

import { RouteMarker } from '../../types/routeMarker';

interface MarkerPositionChange {
  id: string;
  lat: number;
  lng: number;
}
//COMPONENTE MAP: Renderiza el mapa de El Salvador. Unicamente existe un .ts por que no requiere de mas codigo html + css.
@Component({
  imports: [],
  selector: 'app-map',
  styles: [`
    .map-container {
      height: 100%;
      width: 100%;
      min-height: 600px;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
      background-color: #0f172a; /* Fondo oscuro base para evitar destellos */
    }


    /* Animación de entrada para los marcadores */
    @keyframes dropIn {
      0% { transform: translateY(-50px) scale(0); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    // Por esto:
    ::ng-deep .custom-marker {
      background: transparent;
      border: none;
    }

    /* Aplicamos la animación únicamente al div hijo que creaste en el html del icono */
    ::ng-deep .custom-marker > div {
      animation: dropIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
      cursor: pointer;
    }

    /* Estilos para adaptar el popup de Leaflet a la paleta oscura */
    ::ng-deep .custom-dark-popup .leaflet-popup-content-wrapper {
      background: #ffffff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
    }
    ::ng-deep .custom-dark-popup .leaflet-popup-tip {
      background: #ffffff;
      border: 1px solid #e2e8f0;
    }
    ::ng-deep .leaflet-popup-close-button {
      color: #64748b !important;
    }
  `],
  template: `<div #mapContainer class="map-container"></div>`,
})
export class Map implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  // Para manejar el CRUD de los marker
  @Output() markerDeleteRequested = new EventEmitter<string>();
  @Output() markerEditRequested = new EventEmitter<string>();
  @Output() markerPositionChanged = new EventEmitter<MarkerPositionChange>();

  // Coordenadas centrales de El Salvador por defecto
  @Input() center: L.LatLngExpression = [13.794185, -88.89653];
  @Input() zoom: number = 10;
  private map!: L.Map;
  private routeLine: L.Polyline | null = null;

  // Arreglo para mantener el estado y el orden de los marcadores
  private markersData: { id: string; marker: L.Marker }[] = [];

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    //Delimitación geográfica de El Salvador. Para que no se vaya a otros lados
    const elSalvadorBounds = L.latLngBounds(
      L.latLng(13.0, -90.2), // Suroeste
      L.latLng(14.5, -87.5)  // Noreste
    );

    this.map = L.map(this.mapContainer.nativeElement, {
      maxBounds: elSalvadorBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 8,
      maxZoom: 18
    }).setView(this.center, this.zoom);

    //Proveedor gratuito OpenStreetMap. No necesita ni de API key :D
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }
  //Agrega directamente el marcador en la posicion donde este viendo el usuario
  public addDraggableMarker(
    lat: number,
    lng: number,
    title: string,
    description: string,
    type: string,
    color: string = '#a855f7',
    markerId: string = crypto.randomUUID(),
  ): void {

    const customIcon = this.generateCustomIcon(type, color);

    const marker = L.marker([lat, lng], {
      icon: customIcon,
      draggable: true
    }).addTo(this.map);

    marker.bindPopup(this.createPopupContent(title, description, markerId), {
      className: 'custom-dark-popup'
    });

    //Creando listener para los eventos de drag and drop. Ligado a los Outputs.
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      this.markerPositionChanged.emit({
        id: markerId,
        lat: position.lat,
        lng: position.lng,
      });
      this.updateRouteLine();
    });


    marker.on('popupopen', () => {
      const deleteBtn = marker
        .getPopup()
        ?.getElement()
        ?.querySelector<HTMLButtonElement>('[data-action="delete-marker"]');
      const editBtn = marker
        .getPopup()
        ?.getElement()
        ?.querySelector<HTMLButtonElement>('[data-action="edit-marker"]');
      if (deleteBtn) {
        deleteBtn.onclick = () => this.markerDeleteRequested.emit(markerId);
      }
      if (editBtn) {
        editBtn.onclick = () => this.markerEditRequested.emit(markerId);
      }
    });

    // Registrar en el estado y trazar línea
    this.markersData.push({ id: markerId, marker });
    this.updateRouteLine();
  }

  //Modificando la informacion del marcador
  public updateDraggableMarker(routeMarker: RouteMarker): void {
    const markerData = this.markersData.find(({ id }) => id === routeMarker.id);
    if (!markerData) {
      return;
    }

    markerData.marker.setLatLng([routeMarker.lat, routeMarker.lng]);
    markerData.marker.setIcon(this.generateCustomIcon(routeMarker.icon, routeMarker.color));
    markerData.marker.setPopupContent(
      this.createPopupContent(routeMarker.title, routeMarker.description, routeMarker.id),
    );
    this.updateRouteLine();
  }

  public removeDraggableMarker(id: string): void {
    this.removeMarker(id);
  }
  //Para colocar un Icon de donde se encuentra el user (ubicacion actual, no lo que esta viendo en el mapa). No es tan efectivo.
  public locateUser(): void {
    // Leaflet tiene una API nativa que usa navigator.geolocation por debajo
    this.map.locate({ setView: true, maxZoom: 14 });

    // Opcional: Escuchar cuando encuentre la ubicación para poner un punto azul
    this.map.once('locationfound', (e: L.LocationEvent) => {
      L.circleMarker(e.latlng, {
        color: '#3b82f6', // Azul para diferenciarlo de los morados de la ruta
        fillColor: '#3b82f6',
        fillOpacity: 0.8,
        radius: 8
      }).bindPopup('Estás aquí').addTo(this.map);
    });

    this.map.once('locationerror', (e: L.ErrorEvent) => {
      console.warn('Error de geolocalización:', e.message);
      alert('No se pudo acceder a tu ubicación. Verifica los permisos del navegador.');
    });
  }
  public getCenterCoordinates(): { lat: number, lng: number, zoom: number } {
    const center = this.map.getCenter();
    const zoom = this.map.getZoom();

    return {
      lat: center.lat,
      lng: center.lng,
      zoom: zoom
    };
  }

  // === FUNCIONES AUXILIARES ===

  private createPopupContent(title: string, description: string, markerId: string): string {
    return `
      <div style="font-family: sans-serif; min-width: 190px; padding: 4px;">
        <h4 style="margin: 0 0 4px; color: #1e293b; font-size: 15px; font-weight: 600;">${this.escapeHtml(title)}</h4>
        ${description ? `<p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">${this.escapeHtml(description)}</p>` : ''}
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <button type="button" data-action="delete-marker" data-marker-id="${markerId}" style="border: 0; border-radius: 6px; background: #fef2f2; color: #b91c1c; padding: 7px 10px; cursor: pointer; font-size: 12px; font-weight: 600;">
            Eliminar marcador
          </button>
          <button type="button" data-action="edit-marker" data-marker-id="${markerId}" aria-label="Editar marcador" title="Editar marcador" style="display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid #e2e8f0; border-radius: 6px; background: white; color: #475569; cursor: pointer; font-size: 17px;">
            <i class="ri-pencil-line" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return entities[character];
    });
  }



  private generateCustomIcon(type: string, iconColor: string) {
    return L.divIcon({
      className: 'custom-marker',
      // Inyectamos el icono, usando text-shadow para un efecto de resplandor sutil en tu mapa oscuro
      html: `<div class="cursor-pointer flex justify-center items-center w-8.5 h-8.5   rounded-xl bg-[#97f19b] border border-white p-2">
             <i class="${type}" style="color: ${iconColor}; font-size: 28px; text-shadow: 0 0 10px ${iconColor}80;"></i>
           </div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34] // Anclado exactamente en la punta inferior del icono
    });

  }

  private removeMarker(id: string): void {
    const index = this.markersData.findIndex(m => m.id === id);
    if (index !== -1) {
      const markerObj = this.markersData[index];
      this.map.removeLayer(markerObj.marker); // Quitar del mapa visualmente
      this.markersData.splice(index, 1); // Quitar del arreglo lógico
      this.updateRouteLine(); // Actualizar la línea de ruta
    }
  }

  private updateRouteLine(): void {
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    // Obtener las coordenadas actuales de todos los marcadores en el arreglo
    const coordinates = this.markersData.map(m => m.marker.getLatLng());

    // Solo dibujar si hay al menos dos puntos conectados
    if (coordinates.length > 1) {
      this.routeLine = L.polyline(coordinates, {
        color: '#a855f7',
        weight: 4,
        opacity: 0.9,
        dashArray: '8, 12',
        lineJoin: 'round'
      }).addTo(this.map);
    }
  }


}

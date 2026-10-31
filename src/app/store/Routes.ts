
import { UserRoute } from "../types/route";

// Routes por defecto ligadas a estos usuarios
export const ROUTES: UserRoute[] = [
  {
    id: 101,
    category: 'aventura',
    title: 'Aventura en El Pital',
    description: 'Explora las zonas más altas y con mejor clima de El Salvador.',
    autor: 'Bryan Fuentes',
    places: [
      {
        name: 'El Pital',
        description: 'El punto más alto del país, ideal para acampar.',
        location: 'Chalatenango',
        budget: 25,
        hasPeople: 'medium',
        weather: 'frio',
        bestHourVisit: '06:00 AM',
        bestDayVisit: 'Sábado',
        icon: 'ri-landscape-line' as string
      }
    ],
    totalTimeCar: 120,
    totalDistance: 90,
    traveled: 90,
    placesVisited: ['El Pital'],
    percentage: 1.0,
    star: 5
  },
  {
    id: 102,
    category: 'gastronomico',
    title: 'Ruta de las Flores Express',
    description: 'Un recorrido gastronómico y cultural por el occidente.',
    autor: 'Bryan Fuentes',
    places: [
      {
        name: 'Apaneca',
        description: 'Pueblo con clima agradable, famoso por su café y laberinto.',
        location: 'Ahuachapán',
        budget: 35,
        hasPeople: 'lot',
        weather: 'nublado',
        bestHourVisit: '02:00 PM',
        bestDayVisit: 'Domingo',
        icon: 'ri-home-smile-line' as string
      },
      {
        name: 'Juayúa',
        description: 'Conocido por su festival gastronómico de fin de semana.',
        location: 'Sonsonate',
        budget: 20,
        hasPeople: 'lot',
        weather: 'nublado',
        bestHourVisit: '12:00 PM',
        bestDayVisit: 'Domingo',
        icon: 'ri-map-pin-line' as string
      }
    ],
    totalTimeCar: 90,
    totalDistance: 60,
    traveled: 30,
    placesVisited: ['Apaneca'],
    percentage: 0.5,
    star: 4
  },
  {
    id: 201,
    category: 'colonial',
    title: 'Paseo por Suchitoto',
    description: 'Calles empedradas, arquitectura colonial y vistas al lago Suchitlán.',
    autor: 'Celina Gómez',
    places: [
      {
        name: 'Centro Histórico de Suchitoto',
        description: 'Calles empedradas e iglesia de Santa Lucía.',
        location: 'Cuscatlán',
        budget: 15,
        hasPeople: 'medium',
        weather: 'nublado',
        bestHourVisit: '04:00 PM',
        bestDayVisit: 'Sábado',
        icon: 'ri-map-pin-line' as string
      }
    ],
    totalTimeCar: 60,
    totalDistance: 45,
    traveled: 0,
    placesVisited: [],
    percentage: 0,
    star: 5
  }
];

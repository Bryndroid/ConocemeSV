// Usuarios por default con contraseña encriptada


import { User } from "../types/user";
import { ROUTES } from "./Routes";

// Una vez inicializado Angular se crearan y se guardaran estos en LocalStorage.
export const USERS: User[] = [
  {
    id: 1,
    firstName: 'Bryan',
    lastName: 'Fuentes',
    email: 'bryan.fuentes@example.com',
    password: "pbkdf2$100000$6d5f31a9c2e748b1d0a6f4c38e91527b$846ad707129fa6f982899c61cd80427628e5366cf7a7187787d6832b3ad1e0f3",
    turisticRoutes: [ROUTES[0], ROUTES[1]],
    traveledDistance: 120,
    placesDiscovered: ['El Pital', 'Apaneca'],
    traveledMode: 'carro',
    bestCategorie: 'aventura',
    ownedStars: 24
  },
  {
    id: 2,
    firstName: 'Celina',
    lastName: 'Gómez',
    email: 'celina@example.com',
    password: "pbkdf2$100000$e2a94710c63d58b4f1a0739ce5d6283f$088c989d3d3f84aa6e4eaaba846d8cd383311357782fa14e3393d3470237e0a8",
    turisticRoutes: [ROUTES[2]],
    traveledDistance: 0,
    placesDiscovered: [],
    traveledMode: 'carro',
    bestCategorie: 'colonial',
    ownedStars: 10
  }
];

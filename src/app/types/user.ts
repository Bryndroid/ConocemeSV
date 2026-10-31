import { Category } from "./category";
import { UserRoute } from "./route";

export interface User{
  id: number,
  firstName:string,
  lastName: string,
  email: string,
  password:string,
  turisticRoutes: UserRoute[],

  //Stats - Estaticos
  traveledDistance: number,
  placesDiscovered: string[],
  traveledMode:'carro' | 'avion' |'pie',
  bestCategorie: Category,
  ownedStars: number
}

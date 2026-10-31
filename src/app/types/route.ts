import { Category } from "./category"


export interface UserRoute{
  id: number,
  category: Category,
  title: string,
  description: string,
  autor: string,
  places:{
    name: string,
    description: string,
    location: string,
    //Alerts
    budget: number,
    hasPeople: "lot" | "medium" | "low",
    weather: "nublado" | "frio",
    bestHourVisit: string,
    bestDayVisit: string,
    icon: string
  }[],
  totalTimeCar: number,
  totalDistance: number, //km
  traveled: number, //UserData
  placesVisited: string[],//UserData
  percentage: number,//UserData
  star?: number
}

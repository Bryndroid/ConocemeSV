//Service para guardar, borrar y obtener data del LocalStorage referente a los datos
//del User y las rutas turisticas
import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { User } from '../types/user';
import { UserRoute } from '../types/route';
import { USERS } from '../store/Users';
import { ROUTES } from '../store/Routes';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly auth = inject(AuthService);


  // === FUNCIONES CRUD PARA USER
  get AllUsers(): User[] {
    return this.getAllUsers();
  }

  get AllRoutes(): UserRoute[] {
    return this.getAllRoutes();
  }

  getCurrentUser(): User | null {
    if (!this.auth.validateTokenSession()) {
      return null;
    }

    const userId = this.auth.currentUserId();
    const user = this.getAllUsers().find((candidate) => candidate.id === userId) ?? null;
    if (!user) {
      this.auth.dropTokenSession();
    }
    return user;
  }

  getAllUsers(): User[] {
    const storedUsers = localStorage.getItem('USERS');
    return storedUsers === null ? USERS : JSON.parse(storedUsers) as User[];
  }

  getAllRoutes(): UserRoute[] {
    const storedRoutes = localStorage.getItem('ROUTES');
    return storedRoutes === null ? ROUTES : JSON.parse(storedRoutes) as UserRoute[];
  }
  //Al ser MVP priorizare otras cosas antes que agregar esto.
  deleteUser() {}

  updateUser() {}

  newUser(userDetails: Pick<User, 'firstName' | 'lastName' | 'email' | 'password'>): User | null {
    const users = this.getAllUsers();
    if (users.some((user) => user.email.trim().toLowerCase() === userDetails.email.trim().toLowerCase())) {
      return null;
    }

    const newUser: User = {
      ...userDetails,
      id: users.reduce((highestId, user) => Math.max(highestId, user.id), 0) + 1,
      turisticRoutes: [],
      traveledDistance: 0,
      placesDiscovered: [],
      traveledMode: 'pie',
      bestCategorie: 'aventura',
      ownedStars: 0
    };

    localStorage.setItem('USERS', JSON.stringify([...users, newUser]));
    return newUser;
  }

  newRoute(routeDetails: Omit<UserRoute, 'id' | 'autor'>): UserRoute | null {
    const user = this.getCurrentUser();
    if (!user) {
      return null;
    }

    const routes = this.getAllRoutes();
    const newRoute: UserRoute = {
      ...routeDetails,
      autor: `${user.firstName} ${user.lastName}`,
      id: routes.reduce((highestId, route) => Math.max(highestId, route.id), 0) + 1
    };

    localStorage.setItem('ROUTES', JSON.stringify([...routes, newRoute]));
    return newRoute;
  }

}

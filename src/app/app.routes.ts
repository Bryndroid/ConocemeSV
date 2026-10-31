import { Routes } from '@angular/router';
import { AuthLayout } from './layout/auth-layout/auth-layout';
import { Register } from './pages/auth/register/register';
import { Login } from './pages/auth/login/login';
import { MainLayout } from './layout/main-layout/main-layout';
import { authGuardGuard } from './guards/auth.guard-guard';



export const routes: Routes = [

  //Rutas publicas
  {
    path: "auth",
    component: AuthLayout,
    children: [
      {
        path: "register",
        component: Register
      },
      {
        path: "login",
        component: Login
      },
      {
        path: "**",
        redirectTo: "login"
      }
    ]
  },
  //Ruta protegida
  {
    path: "home",
    component: MainLayout,
    children: [
      {
        path: "",
        loadComponent: () => import('./pages/home/home').then((module) => module.Home),
        canActivate: [authGuardGuard]
      }
    ]
  },
  {
    path:"**",
    redirectTo:"/home"
  }

];

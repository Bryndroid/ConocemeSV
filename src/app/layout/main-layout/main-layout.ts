import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { StorageService } from '../../services/storage.service';
import { User } from '../../types/user';
@Component({
  imports: [RouterOutlet, MatToolbar, MatButtonModule, MatBadgeModule],
  selector: 'app-main-layout',
  styleUrl: './main-layout.css',
  templateUrl: './main-layout.html',
})
export class MainLayout {

  private route = inject(Router);
  private storage = inject(StorageService);

  currentUser: User = this.storage.getCurrentUser() as User;
  // Scroll directo a la referencia ID del DOM. Esto por ser MVP se hace asi, de normal sería a pages directas.
  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
  //Logout facil.
  logout(){

    if(confirm('¿Seguro que quieres deslogear?'))
    this.route.navigateByUrl("/auth/login");
  }
}

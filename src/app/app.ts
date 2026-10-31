import { AfterViewInit, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { USERS } from './store/Users';
import { routes } from './app.routes';
import { ROUTES } from './store/Routes';
import { User } from './types/user';
import { AuthService } from './services/auth.service';
import { StorageService } from './services/storage.service';
import {
  SessionRenewalAction,
  SessionRenewalDialog,
  SessionRenewalDialogData
} from './shared/session-renewal-dialog/session-renewal-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnInit, OnDestroy {
  protected readonly title = signal('ConocemeSV');
  //Cuando se inicie la pagina web, empiezo a correr un contador para verificar el token de sesion con las injeccion de los servicios de auth y sotrage
  private readonly auth = inject(AuthService);
  private readonly storage = inject(StorageService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  //El tiempo que voy a tirar el warning. Cuando haga falta de 5 minutos tiro el warning
  private readonly warningTimeMs = 5 * 60 * 1000;
  private sessionMonitor: ReturnType<typeof setInterval> | undefined;
  private warningDialog: MatDialogRef<SessionRenewalDialog, SessionRenewalAction> | undefined;
  private hadActiveSession = false;

  ngOnInit(): void {
    this.checkSession();
    this.sessionMonitor = setInterval(() => this.checkSession(), 5000);
  }

  ngOnDestroy(): void {
    if (this.sessionMonitor !== undefined) {
      clearInterval(this.sessionMonitor);
    }
    this.warningDialog?.close();
  }
  //Despues de iniciar todo, verifico si ya existe una referencia de Users y Routes en el local, si no existe, las creo para que furule bien.
  ngAfterViewInit(): void {
    const storedUsers = localStorage.getItem('USERS');
    if (storedUsers === null) {
      localStorage.setItem('USERS', JSON.stringify(USERS));
    }

    if (localStorage.getItem('ROUTES') === null) {
      localStorage.setItem('ROUTES', JSON.stringify(ROUTES));
    }

  }
  //Handler que cada 5 segundos ira verificando el token y si le falta X tiempo para ver si le advierto
  private checkSession(): void {

    const user = this.storage.getCurrentUser();
    if (!user) {
      if (this.hadActiveSession) {
        this.hadActiveSession = false;
        if (this.warningDialog) {
          this.warningDialog.close('expired');
        } else {
          void this.router.navigateByUrl('/auth/login');
        }
      }
      return;
    }

    this.hadActiveSession = true;
    const remainingMs = this.auth.getSessionRemainingMs();
    if (remainingMs === null || remainingMs > this.warningTimeMs|| this.warningDialog) {
      return;
    }

    const expiresAt = this.auth.sessionExpiresAt();
    if (expiresAt === null) {
      return;
    }
    //Renderizo el modal con los datos ya validados
    this.warningDialog = this.dialog.open<
      SessionRenewalDialog,
      SessionRenewalDialogData,
      SessionRenewalAction
    >(SessionRenewalDialog, {
      data: { expiresAt },
      disableClose: true,
      width: 'min(440px, 92vw)',
      maxWidth: '92vw'
    });
    //En base a lo que haga, hago estas acciones...
    this.warningDialog.afterClosed().subscribe((action) => {
      this.warningDialog = undefined;
      if (action === undefined) {
        return;
      }
      //Si quiere refresh:
      if (action === 'refresh') {
        const currentUser = this.storage.getCurrentUser();
        if (currentUser) {
          this.auth.generateSessionToken(currentUser.id);
          this.hadActiveSession = true;

          return;
        }
      }
      //SI no elige nada o elige otra cosa, lo mando al login otra vez y borro el token.
      this.auth.logoutUser();
      this.hadActiveSession = false;
      void this.router.navigateByUrl('/auth/login');
    });
  }
}

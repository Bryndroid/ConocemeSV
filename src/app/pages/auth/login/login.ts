import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { StorageService } from '../../../services/storage.service';

@Component({
  imports: [MatFormFieldModule, MatInputModule, RouterLink, ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  //Injeccion de dependecias y servicios
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly storage = inject(StorageService);

  readonly loginError = signal('');
  showPassword = false;
  //Creacion del form
  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.email, Validators.required]],
    password: ['', [Validators.minLength(8), Validators.required]]
  })

  //Handler para validaciones
  async onSubmit(): Promise<void> {
    this.loginError.set('');
    if(this.loginForm.invalid){
      this.loginForm.markAllAsTouched()
      return;
    }
    //Consigo el dato en crudo del password y email
    const { email, password } = this.loginForm.getRawValue();
    //Valido directamente con auth service (el maneja toda la logica de autenticacion y validacion).
    const isValidPassword = await this.auth.validatePassword(email, password);
    if (!isValidPassword) {
      this.loginError.set('El correo o la contraseña no son correctos.');
      return;
    }
    //Guardo el user
    const user = this.storage.getAllUsers().find(
      (candidate) => candidate.email.trim().toLowerCase() === email.trim().toLowerCase()
    );
    if (!user) {
      this.loginError.set('No se encontró la cuenta.');
      return;
    }
    //Genero el token en base a ese Id del user creado y navego al home (el guard lo verá).
    this.auth.generateSessionToken(user.id);
    await this.router.navigateByUrl('/home');
  }

}

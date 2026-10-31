import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { StorageService } from '../../../services/storage.service';

@Component({
  imports: [MatFormFieldModule, MatInputModule, RouterLink, ReactiveFormsModule],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  //Injeccion de dependencias y servicios
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  readonly registerError = signal('');
  showPassword = false;
  //Creacion del form
  readonly registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.pattern(/^[\p{L}\s'-]+$/u)]],
    lastName: ['',[Validators.required, Validators.pattern(/^[\p{L}\s'-]+$/u)]],
    email: ['',[Validators.required, Validators.email]],
    password: ['',[Validators.required, Validators.minLength(8)]],
    confirmPassword: ['',[Validators.required]],
    termsConditions: [false, [Validators.requiredTrue]]
  });
  //Handler del form submit para validar la informacion con los datos en LocalStorage.
  async onSubmit(): Promise<void> {
    this.registerError.set('');
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, password, confirmPassword } = this.registerForm.getRawValue();
    if (password !== confirmPassword) {
      this.registerError.set('Las contraseñas no coinciden.');
      return;
    }
    if (!this.auth.validateEmail(email)) {
      this.registerError.set('Ya existe una cuenta con ese correo.');
      return;
    }
    //IMPORTANTE: Encripto la contraseña antes de guardarlo en base al sistema de auth service.
    const encryptedPassword = await this.auth.generateEncrypt(password);
    const user = this.storage.newUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password: encryptedPassword
    });

    if (!user) {
      this.registerError.set('Ya existe una cuenta con ese correo.');
      return;
    }
    //Redirigo al Login para que se pueda generar el token.
    this.router.navigateByUrl('/auth/login');
  }
}

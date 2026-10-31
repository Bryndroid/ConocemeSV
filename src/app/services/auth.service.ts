import { Injectable, signal } from "@angular/core";
import { User } from "../types/user";
import { USERS } from "../store/Users";

//Service para generar y validar tokens de sesion, validar passwords y manejar logout.
@Injectable({ providedIn: 'root' })
export class AuthService {
  //Constantes readonly (Esto al ser un MVP existe aca pero de normal deben de ir mas protegidas en un backend...)
  private readonly sessionKey = 'AUTH_SESSION';
  private readonly passwordHashIterations = 100_000;
  private readonly MINUTES = 10;
  private readonly TIME_SESSION = this.MINUTES * 60 * 1000;
  readonly isAuthenticated = signal(false);
  readonly currentUserId = signal<number | null>(null);
  readonly sessionExpiresAt = signal<number | null>(null);

  constructor() {
    this.validateTokenSession();
  }

  // Compara la contraseña con el hash guardado para el email indicado.
  async validatePassword(email: string, password: string): Promise<boolean> {
    const user = this.getUsers().find(
      (candidate) => candidate.email.trim().toLowerCase() === email.trim().toLowerCase()
    );
    if (!user) {
      return false;
    }
    //Descompongo en las distintas propiedades que guardo en ella para validarlas
    const [algorithm, iterationsValue, saltHex, hashHex] = user.password.split('$');
    const iterations = Number(iterationsValue);
    //Validacion en el formato
    if (
      algorithm !== 'pbkdf2'
      || iterations !== this.passwordHashIterations
      || !/^[\da-f]{32}$/i.test(saltHex)
      || !/^[\da-f]{64}$/i.test(hashHex)
    ) {
      return false;
    }
    //Preparando la key que ocupara PBKDF2
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    //Genero el Hash enbase a los datos de la password del user ya creado (iteraciones y el mismo salt).
    const derived = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: Uint8Array.from(this.fromHex(saltHex)),
        iterations,
        hash: 'SHA-256'
      },
      key,
      256
    );
    //Comparo hashes.
    return this.toHex(new Uint8Array(derived)) === hashHex.toLowerCase();
  }

  // Devuelve true cuando el email todavía no está registrado.
  validateEmail(email: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();
    return !this.getUsers().some(
      (user) => user.email.trim().toLowerCase() === normalizedEmail
    );
  }
  //Generar encriptacion (Algoritmo PBKDF2)
  async generateEncrypt(password: string): Promise<string> {
    //IMPORTANTE: genero un randomValue siempre con la API que me da la web
    const salt = crypto.getRandomValues(new Uint8Array(16));
    //Genero la key
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    //Genero el hash
    const derived = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.passwordHashIterations,
        hash: 'SHA-256'
      },
      key,
      256
    );
    //Lo guardo todo en la contra. Tambien guardo mas parametros para desencriptar. Esto es malo al saber que esto es publico pero al ser MVP es un riesgo que se acepta
    return `pbkdf2$${this.passwordHashIterations}$${this.toHex(salt)}$${this.toHex(new Uint8Array(derived))}`;
  }

  logoutUser(): void {
    this.dropTokenSession();
  }
  //Generacion del tokenSession ocupando la API de crypto web
  generateSessionToken(userId: number): string {
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new TypeError('El identificador de usuario no es válido.');
    }
    //Generando Token (es una simulacion de un JWT)
    const token = this.toHex(crypto.getRandomValues(new Uint8Array(32)));
    const session = {
      token,
      userId,
      expiresAt: this.getExpirationTime()
    };

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
      sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
    }
    this.currentUserId.set(userId);
    this.sessionExpiresAt.set(session.expiresAt);
    this.isAuthenticated.set(true);
    return token;
  }
  //Validaciones para cualquier guard que lo necesite o validator de token en app.ts
  getSessionRemainingMs(): number | null {
    if (!this.validateTokenSession()) {
      return null;
    }

    const expiresAt = this.sessionExpiresAt();
    return expiresAt === null ? null : Math.max(0, expiresAt - Date.now());
  }

  validateTokenSession(token?: string): boolean {
    if (typeof sessionStorage === 'undefined') {
      this.clearSessionState();
      return false;
    }

    const storedSession = sessionStorage.getItem(this.sessionKey);
    if (!storedSession) {
      this.clearSessionState();
      return false;
    }

    let session: { token?: unknown; userId?: unknown; expiresAt?: unknown };
    try {
      session = JSON.parse(storedSession) as typeof session;
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error;
      }
      this.dropTokenSession();
      return false;
    }
    //Importante: Validacion de integridad de datos.
    if (
      typeof session.token !== 'string'
      || typeof session.userId !== 'number'
      || !Number.isSafeInteger(session.userId)
      || typeof session.expiresAt !== 'number'
      || session.expiresAt <= Date.now()
      || (token !== undefined && token !== session.token)
    ) {
      this.dropTokenSession();
      return false;
    }

    this.currentUserId.set(session.userId);
    this.sessionExpiresAt.set(session.expiresAt);
    this.isAuthenticated.set(true);
    return true;
  }

  dropTokenSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.sessionKey);
    }
    this.clearSessionState();

  }

  // === FUNCIONES AUXILIARES ===
  private getUsers(): User[] {
    const storedUsers = localStorage.getItem('USERS');
    if (storedUsers === null) {
      return USERS;
    }

    const users: unknown = JSON.parse(storedUsers);

    return users as User[];
  }

  private toHex(bytes: Uint8Array): string {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  private fromHex(value: string): Uint8Array {
    return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
  }

  private clearSessionState(): void {
    this.currentUserId.set(null);
    this.sessionExpiresAt.set(null);
    this.isAuthenticated.set(false);
  }

  private getExpirationTime(): number {
    return Date.now() + this.TIME_SESSION;
  }
}

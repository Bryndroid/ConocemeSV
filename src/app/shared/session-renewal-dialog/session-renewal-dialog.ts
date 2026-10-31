import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export type SessionRenewalAction = 'refresh' | 'logout' | 'expired';

export interface SessionRenewalDialogData {
  expiresAt: number;
}

@Component({
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './session-renewal-dialog.html',
  styleUrl: './session-renewal-dialog.css'
})
export class SessionRenewalDialog implements OnInit, OnDestroy {
  private readonly data = inject<SessionRenewalDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<SessionRenewalDialog, SessionRenewalAction>);
  private countdownInterval: ReturnType<typeof setInterval> | undefined;
  //En base a los tiempos que tenga el token, genero un contador que el usuario pueda ver
  readonly remainingSeconds = signal(this.calculateRemainingSeconds());
  readonly countdown = computed(() => {
    const minutes = Math.floor(this.remainingSeconds() / 60).toString().padStart(2, '0');
    const seconds = (this.remainingSeconds() % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  });

  ngOnInit(): void {
    this.countdownInterval = setInterval(() => {
      const remaining = this.calculateRemainingSeconds();
      this.remainingSeconds.set(remaining);
      if (remaining === 0) {
        this.dialogRef.close('expired');
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval !== undefined) {
      clearInterval(this.countdownInterval);
    }
  }

  refreshSession(): void {
    this.dialogRef.close('refresh');
  }

  logout(): void {
    this.dialogRef.close('logout');
  }

  private calculateRemainingSeconds(): number {
    return Math.max(0, Math.ceil((this.data.expiresAt - Date.now()) / 1000));
  }
}

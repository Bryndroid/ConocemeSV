import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { UserRoute } from '../../types/route';

type RoutePlace = UserRoute['places'][number];

@Component({
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './place-edit-dialog.html',
})
export class PlaceEditDialog {
  //Manejo basico y normal de un formulario con FormBuilder.
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PlaceEditDialog, RoutePlace>);
  readonly place = inject<RoutePlace>(MAT_DIALOG_DATA);

  readonly placeForm = this.fb.nonNullable.group({
    name: [this.place.name, [Validators.required, Validators.maxLength(100)]],
    description: [this.place.description, [Validators.required, Validators.maxLength(500)]],
    location: [this.place.location, [Validators.required, Validators.maxLength(200)]],
    budget: [this.place.budget, [Validators.required, Validators.min(0)]],
    hasPeople: [this.place.hasPeople, Validators.required],
    weather: [this.place.weather, Validators.required],
    bestHourVisit: [this.place.bestHourVisit, Validators.required],
    bestDayVisit: [this.place.bestDayVisit, Validators.required],
    icon: [this.place.icon, Validators.required],
  });



  save(): void {
    if (this.placeForm.invalid) {
      this.placeForm.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.placeForm.getRawValue());
  }
}

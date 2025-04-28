import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SalleService } from '../../services/salle.service';
import { Salle } from '../../models/sales.models';

@Component({
  selector: 'app-salle-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './salle-create.component.html',
  styleUrls: ['./salle-create.component.css']
})
export class SalleCreateComponent {
  
  
  salleForm!: FormGroup;

  constructor(private fb: FormBuilder, private salleService: SalleService,
    private dialogRef: MatDialogRef<SalleCreateComponent>
  ) {
    this.salleForm = this.fb.group({
      name: ['', Validators.required],
      area: [0, [Validators.required, Validators.min(1)]],
      total_seats: [0, [Validators.required, Validators.min(1)]],
      seated_places: [0, [Validators.required, Validators.min(0)]],
      equipment_description: ['', Validators.required],
      price_per_day: [0, [Validators.required, Validators.min(0)]]
    });
  }

  /**
   * Soumettre le formulaire et ajouter la salle dans Firestore.
   */
  onSubmit(): void {
    if (this.salleForm.valid) {
      const salle: Salle = {
        ...(this.salleForm.value as Salle),
      };
      this.salleService.ajouterSalle(salle).then(() => {
        console.log('Salle ajoutée avec succès');
        this.dialogRef.close(); // <- ferme le dialogue
      });
    }
  }
}

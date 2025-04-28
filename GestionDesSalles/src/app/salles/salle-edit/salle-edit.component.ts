import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { SalleService } from '../../services/salle.service';
import { Salle } from '../../models/sales.models';

@Component({
  selector: 'app-salle-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './salle-edit.component.html',
  styleUrls: ['./salle-edit.component.css']
})
export class SalleEditComponent implements OnInit {

  @Input() salleId!: string; // UID de la salle à modifier

  salleForm!: FormGroup;

  constructor(private fb: FormBuilder, private salleService: SalleService,
    private dialogRef: MatDialogRef<SalleEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { salleId: string }) {}

  ngOnInit(): void {
    // Initialisation du formulaire vide
    this.salleForm = this.fb.group({
      name: ['', Validators.required],
      area: [0, [Validators.required, Validators.min(1)]],
      total_seats: [0, [Validators.required, Validators.min(1)]],
      seated_places: [0, [Validators.required, Validators.min(0)]],
      equipment_description: ['', Validators.required],
      price_per_day: [0, [Validators.required, Validators.min(0)]]
      // dispositions non modifiable
    });

    // Charger les données existantes de la salle
    this.salleService.getSalle(this.salleId).subscribe((salle: Salle) => {
      this.salleForm.patchValue({
        name: salle.name,
        area: salle.area,
        total_seats: salle.total_seats,
        seated_places: salle.seated_places,
        equipment_description: salle.equipment_description,
        price_per_day: salle.price_per_day
      });
    });
  }

  /**
   * Soumettre les modifications.
   */
  onSubmit(): void {
    if (this.salleForm.valid) {
      this.salleService.modifierSalle(this.data.salleId, this.salleForm.value).then(() => {
        console.log('Salle modifiée');
        this.dialogRef.close(); // Fermer le dialogue après succès
      });
    }
  }
}

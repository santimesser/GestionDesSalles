import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SalleService } from '../../../services/salle.service';
import { Salle } from '../../../models/sales.models';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';

@Component({
  selector: 'app-salle-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  templateUrl: './salle-edit.component.html',
  styleUrls: ['./salle-edit.component.css']
})
export class SalleEditComponent implements OnInit {

  @Input() salleId!: string; 

  equipementsDispo: any[] = [];
  equipmentSelection: string[] = [];
  salleForm!: FormGroup;

  constructor(private fb: FormBuilder, private salleService: SalleService,
    private dialogRef: MatDialogRef<SalleEditComponent>,
    private firestore: Firestore,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { salleId: string }) {}

    ngOnInit(): void {
      this.salleForm = this.fb.group({
        name: ['', Validators.required],
        area: [0, [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]],
        total_seats: [0, [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)] ],
        seated_places: [0, [Validators.required, Validators.min(0), Validators.pattern(/^[1-9]\d*$/)]],
        equipment_description: ['', Validators.required],
        price_per_day: [0, [Validators.required, Validators.min(0), Validators.pattern(/^[1-9]\d*$/)]]
      },
        {
          validators: this.capaciteValidator 
        });
    
      const equipementRef = collection(this.firestore, 'equipment');
      collectionData(equipementRef, { idField: 'uid' }).subscribe(data => {
        this.equipementsDispo = data;
      });
    
      // Charger la salle existante
      this.salleService.getSalle(this.data.salleId).subscribe((salle: Salle) => {
        this.salleForm.patchValue({
          name: salle.name,
          area: salle.area,
          total_seats: salle.total_seats,
          seated_places: salle.seated_places,
          equipment_description: salle.equipment_description,
          price_per_day: salle.price_per_day
        });
    
        // Charger les équipements sélectionnés
        if (salle.equipment_ids) {
          this.equipmentSelection = salle.equipment_ids;
        }
      });
    }
    
    onEquipmentChange(id: string, event: any): void {
      if (event.checked) {
        this.equipmentSelection.push(id);
      } else {
        this.equipmentSelection = this.equipmentSelection.filter(eid => eid !== id);
      }
    }
    

  /**
   * Soumettre les modifications.
   */
  onSubmit(): void {
    if (this.salleForm.valid) {
      const salleData = {
        ...(this.salleForm.value),
        equipment_ids: this.equipmentSelection
      };
      this.salleService.modifierSalle(this.data.salleId, salleData).then(() => {
        this.snackBar.open('Salle modifie avec succès !', 'Fermer', {
          duration: 3000,
          verticalPosition: 'bottom'
        });
        this.dialogRef.close();
      });
    }
  }

  capaciteValidator(group: FormGroup) {
    const total = group.get('total_seats')?.value;
    const assis = group.get('seated_places')?.value;
    return total != null && assis != null && total < assis
      ? { capaciteInvalide: true }
      : null;
  }

  quitComposite():void{
    this.dialogRef.close();
    return;
  }
  
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SalleService } from '../../../services/salle.service';
import { Salle } from '../../../models/sales.models';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';


@Component({
  selector: 'app-salle-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  templateUrl: './salle-create.component.html',
  styleUrls: ['./salle-create.component.css']
})
export class SalleCreateComponent {

  
  salleForm!: FormGroup;
  equipementsDispo: any[] = [];
  equipmentSelection: string[] = [];
  total_seats!: number;
  seated_places!: number;

  constructor(private fb: FormBuilder, private salleService: SalleService,
    private auth: Auth,
    private firestore: Firestore,
    private dialogRef: MatDialogRef<SalleCreateComponent>
  ) {
  }

  ngOnInit(): void {
    this.salleForm = this.fb.group({
      name: ['', Validators.required],
      area: [0, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      total_seats: [0, [Validators.required, Validators.min(1)]],
      seated_places: [0, [Validators.required, Validators.min(0)]],
      equipment_description: ['', Validators.required],
      price_per_day: [0, [Validators.required, Validators.min(0)]]
    },
    {
      validators: this.capaciteValidator
    }
  );

  this.total_seats = this.salleForm.get('total_seats')?.value;
  this.seated_places = this.salleForm.get('seated_places')?.value;

    // Charger la liste des équipements disponibles depuis Firestore
    const equipementRef = collection(this.firestore, 'equipment');
    collectionData(equipementRef, { idField: 'uid' }).subscribe(data => {
      this.equipementsDispo = data;
    });
  }

  onEquipmentChange(id: string, checked: boolean): void {
    if (checked) {
      this.equipmentSelection.push(id);
    } else {
      this.equipmentSelection = this.equipmentSelection.filter(eid => eid !== id);
    }
  }

  /**
   * Soumettre le formulaire et ajouter la salle dans Firestore.
   */
  onSubmit(): void {
    if (this.salleForm.valid) {
      const user = this.auth.currentUser;
      if (!user) {
        console.error('Utilisateur non connecté');
        return;
      }
        
      const salle: Salle = {
        ...(this.salleForm.value as Salle),
        equipment_ids: this.equipmentSelection,
        created_by: user.uid  
      };
  
      this.salleService.ajouterSalle(salle).then(() => {
        console.log('Salle ajoutée avec succès');
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
  
  
}

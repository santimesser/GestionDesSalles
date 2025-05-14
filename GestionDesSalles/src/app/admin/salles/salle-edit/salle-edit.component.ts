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

    /* ********************* Variables *********************** */

  @Input() salleId!: string; 
  equipementsDispo: any[] = [];
  equipmentSelection: string[] = [];
  salleForm!: FormGroup;

    /* ********************* constructor *********************** */

  constructor(private fb: FormBuilder, private salleService: SalleService,
    private dialogRef: MatDialogRef<SalleEditComponent>,
    private firestore: Firestore,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { salleId: string }) {}

        /* ********************* fonctions *********************** */

  /**
   * Fonction appelée lors de l'initialisation du composant.
   * Permet de charger les données de la salle existante et des équipements disponibles.
   */
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
      this.salleService.getSalle(this.data.salleId).subscribe((salle: Salle) => {
        this.salleForm.patchValue({
          name: salle.name,
          area: salle.area,
          total_seats: salle.total_seats,
          seated_places: salle.seated_places,
          equipment_description: salle.equipment_description,
          price_per_day: salle.price_per_day
        });
        if (salle.equipment_ids) {// Vérifie si equipment_ids est défini 
          this.equipmentSelection = salle.equipment_ids;
        }
      });
    }
    
    /**
     * Mise a jour du tableau des équipements selectionnés en fonction de l'état du checkbox.
     * @param id L'ID de l'équipement qui a été modifié.
     * @param event L'évènement qui a été déclenché.
     */
    onEquipmentChange(id: string, event: any): void {
      if (event.checked) {// si le checkbox est coché
        this.equipmentSelection.push(id);
      } else {
        this.equipmentSelection = this.equipmentSelection.filter(eid => eid !== id);
      }
    }
    
  /**
   * Modifie la salle en fonction des données du formulaire.
   * Si le formulaire est valide, les données sont stockées dans Firestore.
   * Un message de confirmation est affiché, puis la boîte de dialogue est fermée.
   */
  onSubmit(): void {
    if (this.salleForm.valid) {// si le formulaire est valide
      const salleData = {
        name: this.salleForm.value.name,
        area: this.salleForm.value.area,
        total_seats: this.salleForm.value.total_seats,
        seated_places: this.salleForm.value.seated_places,
        equipment_description: this.salleForm.value.equipment_description,
        price_per_day: this.salleForm.value.price_per_day,
        equipment_ids: this.equipmentSelection
      }
      ;
      this.salleService.modifierSalle(this.data.salleId, salleData).then(() => {
        this.snackBar.open('Salle modifie avec succès !', 'Fermer', {
          duration: 3000,
          verticalPosition: 'bottom'
        });
        this.dialogRef.close();
      });
    }
  }

  /**
   * Valideur pour les capacités.
   * Vérifie si la capacité totale est supérieure ou égale à la capacité avec tables.
   * Si la capacité totale est inférieure à la capacité avec tables, renvoie un objet avec la cle, { capaciteInvalide: true }.
   * Sinon, renvoie null.
   * @param group Formulaire de la salle.
   * @returns null si la capacité totale est supérieure ou égale à la capacité avec tables, un objet avec la cle { capaciteInvalide: true } sinon.
   */
  capaciteValidator(group: FormGroup) {
    const total = group.get('total_seats')?.value;
    const assis = group.get('seated_places')?.value;
    return total != null && assis != null && total < assis
      ? { capaciteInvalide: true }
      : null;
  }

  /**
   * Ferme la boîte de dialogue.
   * Appele lorsque l'utilisateur clique sur le bouton "Annuler".
   * @returns {void} Ne renvoie rien.
   */
  quitComposite():void{
    this.dialogRef.close();
    return;
  }  
}

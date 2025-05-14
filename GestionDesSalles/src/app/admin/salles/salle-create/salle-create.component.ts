import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
    MatCheckboxModule,
    MatSnackBarModule,
  ],
  templateUrl: './salle-create.component.html',
  styleUrls: ['./salle-create.component.css']
})
export class SalleCreateComponent {

 /* ********************* Variables *********************** */
  
  salleForm!: FormGroup;
  equipementsDispo: any[] = [];
  equipmentSelection: string[] = [];
  total_seats!: number;
  seated_places!: number;

   /* ********************* constructor *********************** */

  constructor(private fb: FormBuilder, private salleService: SalleService,
    private auth: Auth,
    private firestore: Firestore,
    private dialogRef: MatDialogRef<SalleCreateComponent>,
    private snackBar: MatSnackBar
  ) {
  }

   /* ********************* fonctions *********************** */

  /**
   * Fonction appelée lors de l'initialisation du composant.
   * Initialise le formulaire de la salle avec les validateurs et les valeurs par défaut.
   * Charge la liste des équipements disponibles depuis Firestore.
   * @returns {void}
   */
  ngOnInit(): void {
    this.salleForm = this.fb.group({
      name: ['', Validators.required],
      area: [0, [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]],
      total_seats: [0, [Validators.required, Validators.min(1), Validators.pattern(/^[1-9]\d*$/)]],
      seated_places: [0, [Validators.required, Validators.min(0), Validators.pattern(/^[1-9]\d*$/)]],
      equipment_description: ['', Validators.required],
      price_per_day: [0, [Validators.required, Validators.min(0), Validators.pattern(/^[1-9]\d*$/)]]
    },
      {
        validators: this.capaciteValidator
      }
    );

    this.total_seats = this.salleForm.get('total_seats')?.value;
    this.seated_places = this.salleForm.get('seated_places')?.value;
    const equipementRef = collection(this.firestore, 'equipment');
    collectionData(equipementRef, { idField: 'uid' }).subscribe(data => {
      this.equipementsDispo = data;
    });
  }

  /**
   * Met à jour le tableau des équipements selectionnés en fonction de l'état du checkbox.
   * @param id L'ID de l'équipement qui a été modifié.
   * @param checked L'état du checkbox.
   * @returns void
   */
  onEquipmentChange(id: string, checked: boolean): void {
    if (checked) {//si le checkbox est coché
      this.equipmentSelection.push(id);
    } else {
      this.equipmentSelection = this.equipmentSelection.filter(eid => eid !== id);
    }
  }

  /**
   * Enregistre la salle dans Firestore.
   * Si le formulaire est valide, les données sont stockées dans Firestore.
   * Un message de confirmation est affiché, puis la boîte de dialogue est fermée.
   * @returns void
   */
  onSubmit(): void {
    if (this.salleForm.valid) {// si le formulaire est valide
      const user = this.auth.currentUser;
      if (!user) {
        console.error('Utilisateur non connecté');
        return;
      }
      const salle: Salle = {
        name: this.salleForm.value.name,
        area: this.salleForm.value.area,
        total_seats: this.salleForm.value.total_seats,
        seated_places: this.salleForm.value.seated_places,
        equipment_description: this.salleForm.value.equipment_description,
        price_per_day: this.salleForm.value.price_per_day,
        equipment_ids: this.equipmentSelection,
        created_by: user.uid
      };      
      this.salleService.ajouterSalle(salle).then(() => {
        this.dialogRef.close();
        this.snackBar.open('Salle créée avec succès !', 'Fermer', {
          duration: 3000,
          verticalPosition: 'bottom'
        });
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

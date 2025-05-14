import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { SalleService } from '../../services/salle.service';
import { Salle } from '../../models/sales.models';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { SalleCreateComponent } from './salle-create/salle-create.component';
import { SalleEditComponent } from './salle-edit/salle-edit.component';
import { HeaderComponent } from '../../composants/header/header.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-salle-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent,
    MatSnackBarModule],
  templateUrl: './salle-dashboard.component.html',
  styleUrls: ['./salle-dashboard.component.css']
})
export class SalleDashboardComponent implements OnInit {

    /* ********************* Variables *********************** */

  sallesFullList: Salle[] = []; 
  equipementsDispo: any[] = []; 
  currentPage: number = 1; 
  pageSize: number = 6;
  selectedComponent: boolean = true;

    /* ********************* constructeur *********************** */

  constructor(
    private dialog: MatDialog,
    private salleService: SalleService,
    private firestore: Firestore,
    private snackBar: MatSnackBar,
    private auth: Auth
  ) {}

    /* ********************* Fonctions *********************** */ 

  /**
   * Appel  lors de l'initialisation du composant.
   * - Charge la liste des salles pour l'utilisateur connect .
   * - Charge la liste des quipements disponibles.
   * @returns {void}
   */
  ngOnInit(): void {
    this.auth.onAuthStateChanged(user => {
      if (user) {// si l'utilisateur est deja connecte
        this.salleService.listerSalles(user.uid).subscribe(data => {
          this.sallesFullList = data;
        });
      }
    });
    const equipementRef = collection(this.firestore, 'equipment');
    collectionData(equipementRef, { idField: 'uid' }).subscribe(data => {
      this.equipementsDispo = data;
    });
  }

  /**
   * Ouvre le formulaire de modification d'une salle existante.
   * @param salleId {string} L'ID unique de la salle que l'on souhaite modifier.
   */
  ouvrirFormulaireModifier(salleId: string): void {
    this.dialog.open(SalleEditComponent, {
      width: '400px',
      data: { salleId: salleId }
    });
  }

  /**
   * Ouvre le formulaire de creation d'une salle.
   */
  ouvrirFormulaireCreation(): void {
    this.dialog.open(SalleCreateComponent, {
      width: '400px'
    });
  }

/**
 * Supprime une salle après confirmation de l'utilisateur.
 * 
 * @param salleId Identifiant de la salle à supprimer.
 * @returns void
 */
  supprimerSalle(salleId: string): void {
    if (confirm('Voulez-vous vraiment supprimer cette salle ?')) {// si l'utilisateur confirme la suppression
      this.salleService.supprimerSalle(salleId).then(() => {
        this.snackBar.open('Salle modifie avec succès !', 'Fermer', {
          duration: 3000,
          verticalPosition: 'bottom'
        });
        this.sallesFullList = this.sallesFullList.filter(s => s.uid !== salleId); // Mise à jour immédiate de la liste
      });
    }
  }

  /** 
   * Renvoie le nom de l'equipement correspondant l'ID donne.
   * Si l'equipement n'est pas trouve, renvoie 'Inconnu'.
   * @param id {string} L'ID unique de l'equipement.
   * @returns {string} Le nom de l'equipement.
   */
  getEquipmentName(id: string): string {
    const equip = this.equipementsDispo.find(e => e.uid === id);
    return equip ? equip.name : 'Inconnu';
  }

  /**
   * Renvoie un tableau contenant les salles visibles sur la page actuelle.
   * La pagination est geree en fonction de la propriete currentPage et pageSize.
   * @returns {Salle[]} Les salles affichees sur la page actuelle.
   */
  getVisibleSalles(): Salle[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.sallesFullList.slice(startIndex, startIndex + this.pageSize);
  }

  /**
   * Charger la page suivante.
   * Si il y a plus de salles que la taille de la page, incrémente la propriete currentPage.
   */
   loadNextPage(): void {
    if (this.hasMoreSalles()) {// si il y a plus de salles que la taille de la page
      this.currentPage++;
    }
  }

  /**
   * Charger la page precedente.
   * Si la page actuelle n'est pas la premi re, d cremente la propri t  currentPage.
   */
  loadPreviousPage(): void {
    if (this.hasPreviousSalles()) {// si la page actuelle n'est pas la premiere de la pagination
      this.currentPage--;
    }
  }

  /**
   * Verifie s'il existe des salles suivantes.
   * @returns {boolean} Vrai si il y a des salles suivantes, faux sinon.
   */
  hasMoreSalles(): boolean {
    return this.currentPage * this.pageSize < this.sallesFullList.length;
  }

  /**
   * Vérifier s'il existe une page précédente.
   */
  hasPreviousSalles(): boolean {
    return this.currentPage > 1;
  }
  
  /**
   * Permet de switcher entre le formulaire de création de salle et la liste des salles.
   * La propri t  selectedComponent est un boolean qui permet de g rer l'affichage
   * de l'un ou de l'autre.
   */
  triggerComponent(): void {
    this.selectedComponent = !this.selectedComponent;
  }
  
}

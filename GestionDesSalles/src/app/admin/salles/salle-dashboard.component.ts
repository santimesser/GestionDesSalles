import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { SalleService } from '../../services/salle.service';
import { Salle } from '../../models/sales.models';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { SalleCreateComponent } from './salle-create/salle-create.component';
import { SalleEditComponent } from './salle-edit/salle-edit.component';
import { AdminReservationsComponent } from '../admin-reservations/admin-reservations.component';
import { HeaderComponent } from '../../composants/header/header.component';

@Component({
  selector: 'app-salle-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent,AdminReservationsComponent],
  templateUrl: './salle-dashboard.component.html',
  styleUrls: ['./salle-dashboard.component.css']
})
export class SalleDashboardComponent implements OnInit {

  sallesFullList: Salle[] = []; // Toutes les salles chargées
  equipementsDispo: any[] = []; // Équipements disponibles
  currentPage: number = 1; // Page actuelle
  pageSize: number = 6; // Nombre de salles par page

  constructor(
    private dialog: MatDialog,
    private salleService: SalleService,
    private firestore: Firestore,
    private auth: Auth
  ) {}

  ngOnInit(): void {
    // Charger les salles après authentification
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.salleService.listerSalles(user.uid).subscribe(data => {
          this.sallesFullList = data;
        });
      }
    });

    // Charger les équipements disponibles
    const equipementRef = collection(this.firestore, 'equipment');
    collectionData(equipementRef, { idField: 'uid' }).subscribe(data => {
      this.equipementsDispo = data;
    });
  }

  /**
   * Ouvre le formulaire de modification d'une salle existante.
   */
  ouvrirFormulaireModifier(salleId: string): void {
    this.dialog.open(SalleEditComponent, {
      width: '400px',
      data: { salleId: salleId }
    });
  }

  /**
   * Ouvre le formulaire de création d'une nouvelle salle.
   */
  ouvrirFormulaireCreation(): void {
    this.dialog.open(SalleCreateComponent, {
      width: '400px'
    });
  }

  /**
   * Supprime une salle après confirmation.
   */
  supprimerSalle(salleId: string): void {
    if (confirm('Voulez-vous vraiment supprimer cette salle ?')) {
      this.salleService.supprimerSalle(salleId).then(() => {
        console.log('Salle supprimée avec succès');
        this.sallesFullList = this.sallesFullList.filter(s => s.uid !== salleId); // Mise à jour immédiate de la liste
      });
    }
  }

  /**
   * Retourne le nom de l'équipement à partir de son ID.
   */
  getEquipmentName(id: string): string {
    const equip = this.equipementsDispo.find(e => e.uid === id);
    return equip ? equip.name : 'Inconnu';
  }

  /**
   * Obtenir les salles visibles pour la pagination.
   */
  getVisibleSalles(): Salle[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.sallesFullList.slice(startIndex, startIndex + this.pageSize);
  }

  /**
   * Passer à la page suivante.
   */
  loadNextPage(): void {
    if (this.hasMoreSalles()) {
      this.currentPage++;
    }
  }

  /**
   * Revenir à la page précédente.
   */
  loadPreviousPage(): void {
    if (this.hasPreviousSalles()) {
      this.currentPage--;
    }
  }

  /**
   * Vérifier s'il existe une page suivante.
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
}

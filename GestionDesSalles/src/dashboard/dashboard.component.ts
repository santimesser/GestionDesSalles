import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { HeaderComponent } from '../app/composants/header/header.component';
import { ReservationCreateComponent } from '../app/client/reservation-create/reservation-create.component';
import { AuthService } from '../app/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {

  /* ********************* Variables *********************** */
  
  userName: string = 'Utilisateur';
  userId: string = '';
  userRole: string = '';
  salles: any[] = [];
  currentPage: number = 1;
  pageSize: number = 8;

  /* ********************* Constructor *********************** */

  constructor(
    private authService: AuthService,
    private firestore: Firestore,
    private dialog: MatDialog,
    private router: Router
  ) { }

  /* ********************* Fonctions *********************** */

  /**
   * Rend la page de dashboard accessible uniquement aux utilisateurs connectes avec le role "client".
   * Si l'utilisateur est connect avec le role "admin", le redirige vers la page d'administration.
   * Si l'utilisateur n'est pas connect , le redirige vers la page de connexion.
   * Recupere informations de l'utilisateur actuellement connecte.
   * Recupere les salles enregistrees dans Firestore.
   */
  async ngOnInit() {
    const user = await this.authService.getCurrentUser(); // donnees de l'utilisateur
    const userWithRole = await firstValueFrom(this.authService.getCurrentUserWithRole()); //role de l'utilisateur
    if (userWithRole?.role === 'admin') {
      this.router.navigate(['/admin']);
      return;
    }
    if (user) {
      const userData = await this.authService.getUserData(user.uid);
      this.userId = user.uid;
      this.userName = userData?.username || user.displayName || 'Utilisateur';
      this.userRole = userWithRole?.role || '';
    } 
    const salleRef = collection(this.firestore, 'rooms');
    collectionData(salleRef, { idField: 'id' }).subscribe((salles) => {
      this.salles = salles;
    });
  }

  /**
   * Les salles visibles pour la pagination.
   * @returns {any[]} Les salles à afficher.
   */
  get paginatedSalles() {
    const start_Page = (this.currentPage - 1) * this.pageSize;
    const end_Page = start_Page + this.pageSize;
    return this.salles.slice(start_Page, end_Page);
  }

  /**
   * Le nombre total de pages pour la pagination.
   * @returns {number} Le nombre de pages.
   */
  get totalPages() {
    return Math.ceil(this.salles.length / this.pageSize); 
  }

/**
 * Passer à la page prédécedente.
 */
  prevPage() {
    if (this.currentPage > 1) { // si la page actuelle est plus grande que 1
      this.currentPage--;
    }
  }


  /**
   * Passer à la page suivante.
   */
  nextPage() {
    if (this.currentPage < this.totalPages) {// si la page actuelle est plus petite que le nombre de pages
      this.currentPage++;
    }
  }

  /**
   * Ouvre le formulaire de réservation pour une salle donnée si l'utilisateur est connecté et a le rôle client.
   * Sinon, redirige vers la page de login.
   * @param salle La salle à reserver.
   */
  async ouvrirReservation(salle: any) {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }
    const userWithRole = await firstValueFrom(this.authService.getCurrentUserWithRole()); // Utilisation de firstValueFrom
    if (userWithRole?.role === 'client') {
      this.dialog.open(ReservationCreateComponent, {
        width: '500px',
        data: { salle }
      });
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
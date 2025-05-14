import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../composants/header/header.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation.service';
import { FormsModule } from '@angular/forms'; 
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReservationEditComponent } from '../reservation-edit/reservation-edit.component';
import { Auth } from '@angular/fire/auth';


@Component({
  selector: 'app-client-reservation',
  imports: [CommonModule, HeaderComponent, RouterModule, MatTabsModule, FormsModule],
  templateUrl: './client-reservation.component.html',
  styleUrl: './client-reservation.component.css'
})
export class ClientReservationComponent implements OnInit {

    /* ********************* Variables *********************** */

  userName: string = 'Utilisateur';
  userId: string = '';
  userRole: string = '';
  reservations: any[] = [];
  currentPage: number = 1;
  pageSize: number = 4;

    /* ********************* constructeur *********************** */

  constructor(
    private authService: AuthService,
    private router: Router,
    private reservationService: ReservationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private auth: Auth
  ) {}

  /* ********************* fonctions *********************** */

  /**
   * Appel  lors de l'initialisation du composant.
   * - Verifie si l'utilisateur est connect .
   * - Si l'utilisateur est connect , recupere ses informations.
   * - Sinon, redirige vers la page de connexion.
   * - Charge les reservations de l'utilisateur.
   * @returns {void}
   */
  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (user) {// si l'utilisateur est connecté
      const userData = await this.authService.getUserData(user.uid);
      this.userId = user.uid;
      this.userName = userData?.username || user.displayName || 'Utilisateur';
    } else {
      this.router.navigate(['/auth/login']);
    }
    this.reservationService.getReservationsForUser(this.userId).subscribe((data: any[]) => {
      this.reservations = data.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    });
    this.loadReservations();
  }

  /**
   * Renvoie les r servations pagin es.
   * Retourne un tableau contenant les r servations de l'utilisateur actuel,
   * mais uniquement celles qui sont comprises entre la page courante et la
   * page suivante.
   * @returns {any[]} Un tableau de r servations.
   */
  get paginatedReservations() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.reservations.slice(start, end);
  }

  /**
   * Nombre total de pages de reservations.
   * @returns {number} Le nombre total de pages.
   */
  get totalPages() {
    return Math.ceil(this.reservations.length / this.pageSize);
  }

  /**
   * Passe  la page precedente.
   * Si la page actuelle est superieure a 1, decremente la propriete currentPage.
   * @returns {void}
   */
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  /**
   * Passe  la page suivante.
   * Si la page actuelle est inferieure au nombre total de pages, incremente la propriete currentPage.
   * @returns {void}
   */
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  /**
   * Navigue vers la page de reservation.
   * Redirige vers la page de reservation.
   * @returns {void}
   */
  toggleReserver() {
    this.router.navigate(['/dashboard']);
  }
  
  /**
   * Navigue vers la page de gestion.
   * Redirige vers la page de gestion des reservations.
   * @returns {void}
   */
  toggleGestion() {
    this.router.navigate(['/gestion']);
  }

  /**
   * Ouvre le formulaire de modification d'une reservation.
   * @param reservationId L'ID unique de la reservation que l'on souhaite modifier.
   * @returns void
   */
  ouvrirFormulaireModifier(reservationId: string): void {
    this.dialog.open(ReservationEditComponent, {
      width: '500px',
      data: { reservationId }
    });
    this.loadReservations();
  }

/**
 * Charge les réservations de l'utilisateur actuellement connecté.
 * - Vérifie l'état de l'authentification de l'utilisateur.
 * - Si l'utilisateur est authentifié, récupère ses réservations via le service de réservation.
 * - Met à jour la liste des réservations avec les données récupérées.
 * @returns {void}
 */

  loadReservations() {
    this.auth.onAuthStateChanged(user => {
      if (user) {// si l'utilisateur est deja connecte
        this.reservationService.getReservationsForUser(user.uid).subscribe((reservations: any[]) => {
          this.reservations = reservations;
        });
      }
    });
  }
  
  /**
   * Supprime une réservation.
   * Vérifie que la réservation existe dans la liste des réservations de l'utilisateur actuel.
   * Vérifie que la date de début de la réservation est à plus de 14 jours.
   * Si ces conditions sont remplies, supprime la réservation via le service de réservation.
   * @param reservationId L'ID unique de la réservation que l'on souhaite supprimer.
   * @returns void
   */
  supprimerReservation(reservationId: string): void {
    const reservation = this.reservations.find(r => r.uid === reservationId);
    if (!reservation) {// si la reservation n'existe pas
      this.snackBar.open('Réservation introuvable.', 'Fermer', { duration: 3000 });
      return;
    }
  
    const startDate = new Date(reservation.startDate);
    const now = new Date();
    const diffJours = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
    if (diffJours <= 14) {// si la reservation a moins de 14 jours
      this.snackBar.open('Vous ne pouvez plus supprimer une réservation à moins de 14 jours.', 'Fermer', { duration: 3000 });
      return;
    }

    if (confirm('Voulez-vous vraiment supprimer cette réservation ?')) {// si l'utilisateur confirme la suppression
      this.reservationService.supprimerReservation(reservationId).then(() => {
        this.snackBar.open('Réservation supprimée avec succès !', 'Fermer', {
          duration: 3000,
          verticalPosition: 'bottom'
        });
        this.reservations = this.reservations.filter(r => r.uid !== reservationId);
      });
    }
  }
}
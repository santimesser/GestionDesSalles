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
import { ReservationCreateComponent } from '../reservation-create/reservation-create.component';
import { ReservationEditComponent } from '../reservation-edit/reservation-edit.component';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';


@Component({
  selector: 'app-client-reservation',
  imports: [CommonModule, HeaderComponent, RouterModule, MatTabsModule, FormsModule],
  templateUrl: './client-reservation.component.html',
  styleUrl: './client-reservation.component.css'
})
export class ClientReservationComponent implements OnInit {
  userName: string = 'Utilisateur';
  userId: string = '';
  userRole: string = '';
  reservations: any[] = [];
  currentPage: number = 1;
  pageSize: number = 4;

  constructor(
    private authService: AuthService,
    private router: Router,
    private reservationService: ReservationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private auth: Auth
  ) {}

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      const userData = await this.authService.getUserData(user.uid);
      this.userId = user.uid;
      this.userName = userData?.username || user.displayName || 'Utilisateur';
    } else {
      this.router.navigate(['/auth/login']);
    }

    this.reservationService.getReservationsForUser(this.userId).subscribe(data => {
      this.reservations = data.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    });
    this.loadReservations();
  }

  get paginatedReservations() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.reservations.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.reservations.length / this.pageSize);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  toggleReserver() {
    this.router.navigate(['/dashboard']);
  }
  
  toggleGestion() {
    this.router.navigate(['/gestion']);
  }

  ouvrirFormulaireModifier(reservationId: string): void {
    this.dialog.open(ReservationEditComponent, {
      width: '500px',
      data: { reservationId }
    });
    this.loadReservations();
  }

  loadReservations() {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.reservationService.getReservationsForUser(user.uid).subscribe(reservations => {
          this.reservations = reservations;
        });
      }
    });
  }
  
  supprimerReservation(reservationId: string): void {
    if (confirm('Voulez-vous vraiment supprimer cette réservation ?')) {
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
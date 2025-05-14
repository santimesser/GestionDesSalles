import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  templateUrl: './admin-reservations.component.html',
  styleUrls: ['./admin-reservations.component.css'],
  imports: [CommonModule, FormsModule] 
})
export class AdminReservationsComponent implements OnInit {

  /* ********************* Variables *********************** */

  reservations: any[] = [];
  filteredReservations: any[] = [];
  filterUser: string = '';
  filterRoom: string = '';
  filterDate: string = '';

  /* ********************* Constructor *********************** */

  constructor(private reservationService: ReservationService) {}

  /* ********************* function *********************** */

  /**
   * Initialisation du composant : on charge les reserveations de la base de donn es.
   * On copie le tableau des reserveations pour ne pas affecter l'original en cas de filtrage.
   */
  ngOnInit(): void {
    this.reservationService.getAllReservations().subscribe(data => {
      this.reservations = data;
      this.filteredReservations = [...data];
    });
  }

  /**
   * Filtre les reservations en fonction des valeurs de filtre courantes.
   * Les filtres sont appliqes de facon acumulative.
   * Les valeurs de filtre sont consideres comme des pattern pour une recherche
   * de type "contient" (ainsi, si le filtre est "abcd", les valeurs "abcde" et
   * "abcdf" seront consid er es comme valides).
   */
  applyFilters(): void {
    this.filteredReservations = this.reservations.filter(reservation => {
      const userMatches = this.filterUser === '' ||
        (reservation.user && reservation.user.username?.toLowerCase().includes(this.filterUser.toLowerCase()));
      const roomMatches = this.filterRoom === '' ||
        (reservation.room && reservation.room.name?.toLowerCase().includes(this.filterRoom.toLowerCase()));
      const dateMatches = this.filterDate === '' ||
        (reservation.startDate && reservation.startDate.toISOString().startsWith(this.filterDate));
      return userMatches && roomMatches && dateMatches;
    });
  }

  /**
   * Remet les filtres leur valeur par defaut (rien), et recharge le tableau des
   * reservations filtres avec le tableau des reservations non filtre.
   */
  resetFilters(): void {
    this.filterUser = '';
    this.filterRoom = '';
    this.filterDate = '';
    this.filteredReservations = [...this.reservations];
  }
}

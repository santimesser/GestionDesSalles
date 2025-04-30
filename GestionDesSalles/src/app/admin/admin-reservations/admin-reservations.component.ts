import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation.service';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './admin-reservations.component.html',
  styleUrls: ['./admin-reservations.component.css']
})
export class AdminReservationsComponent implements OnInit {
  reservations$!: Observable<any[]>;

  constructor(private reservationService: ReservationService) {}

  ngOnInit(): void {
    // Chargement des réservations enrichies (utilisateur + salle)
    this.reservations$ = this.reservationService.getAllReservations();
  }
}

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
  reservations: any[] = [];
  filteredReservations: any[] = [];

  filterUser: string = '';
  filterRoom: string = '';
  filterDate: string = '';

  constructor(private reservationService: ReservationService) {}

  ngOnInit(): void {
    this.reservationService.getAllReservations().subscribe(data => {
      this.reservations = data;
      this.filteredReservations = [...data];
    });
  }

  applyFilters(): void {
    this.filteredReservations = this.reservations.filter(res => {
      const matchUser = this.filterUser === '' || res.user?.username?.toLowerCase().includes(this.filterUser.toLowerCase());
      const matchRoom = this.filterRoom === '' || res.room?.name?.toLowerCase().includes(this.filterRoom.toLowerCase());
      const matchDate = this.filterDate === '' || (res.startDate && res.startDate.toISOString().startsWith(this.filterDate));
      return matchUser && matchRoom && matchDate;
    });
  }

  resetFilters(): void {
    this.filterUser = '';
    this.filterRoom = '';
    this.filterDate = '';
    this.filteredReservations = [...this.reservations];
  }
}

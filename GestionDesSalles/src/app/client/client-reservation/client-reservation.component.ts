import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../composants/header/header.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation.service';
import { FormsModule } from '@angular/forms'; 
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-client-reservation',
  imports: [CommonModule, HeaderComponent, RouterModule, MatTabsModule, FormsModule],
  templateUrl: './client-reservation.component.html',
  styleUrl: './client-reservation.component.css'
})
export class ClientReservationComponent  implements OnInit {
  userName: string = 'Utilisateur';
  userId: string = '';
  userRole: string = '';
  reservations: any[] = [];
  filteredReservations: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private reservationService: ReservationService
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
      console.log('Réservations trouvées:', data);
      this.reservations = data;
      this.filteredReservations = [...data];
    });
    

  }

  toggleReserver() {
    this.router.navigate(['/reserver']);
  }
  
  toggleGestion() {
    this.router.navigate(['/gestion']);
  }
}
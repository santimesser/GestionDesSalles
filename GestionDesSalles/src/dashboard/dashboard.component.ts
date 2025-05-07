import { Component, OnInit } from '@angular/core';
import { AuthService } from '../app/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../app/composants/header/header.component';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { ReservationCreateComponent } from '../app/client/reservation-create/reservation-create.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userName: string = 'Utilisateur';
  userId: string = '';
  userRole: string = '';
  salles: any[] = [];

  constructor(
    private authService: AuthService,
    private firestore: Firestore,
    private dialog: MatDialog,
    private router: Router
  ) { }

  async ngOnInit() {
    // Vérifie l'utilisateur connecté
    const user = await this.authService.getCurrentUser();
    const userWithRole = await firstValueFrom(this.authService.getCurrentUserWithRole());

    console.log('Utilisateur connecté :', userWithRole);

    // Redirection si admin
    if (userWithRole?.role === 'admin' && this.router.url !== '/admin') {
      this.router.navigate(['/admin']);
      return;
    }

    // Chargement des infos utilisateur
    if (user) {
      const userData = await this.authService.getUserData(user.uid);
      this.userId = user.uid;
      this.userName = userData?.username || user.displayName || 'Utilisateur';
      this.userRole = userWithRole?.role || '';
    } else {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Charger toutes les salles
    const salleRef = collection(this.firestore, 'rooms');
    collectionData(salleRef, { idField: 'id' }).subscribe((salles) => {
      this.salles = salles;
    });
  }

  async ouvrirReservation(salle: any) {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const userWithRole = await firstValueFrom(this.authService.getCurrentUserWithRole());
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

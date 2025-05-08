import { Component, OnInit } from '@angular/core';
import { AuthService } from '../app/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../app/composants/header/header.component';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { ReservationCreateComponent } from '../app/client/reservation-create/reservation-create.component';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userName: string = 'Utilisateur';
  userId: string = '';
  userRole: string = '';
  salles: any[] = [];
  currentPage: number = 1;
  pageSize: number = 8;

  constructor(
    private authService: AuthService,
    private firestore: Firestore,
    private dialog: MatDialog,
    private router: Router
  ) { }

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    const userWithRole = await firstValueFrom(this.authService.getCurrentUserWithRole());

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

  get paginatedSalles() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.salles.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.salles.length / this.pageSize);
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
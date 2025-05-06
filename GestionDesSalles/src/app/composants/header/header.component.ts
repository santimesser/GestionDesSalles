import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Firestore, doc, onSnapshot, Unsubscribe, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    CommonModule,
    MatDividerModule,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  constructor(private authService: AuthService, private firestore: Firestore, private router: Router) { }

  userName: string = 'Utilisateur';
  isMenuOpen = false;
  userId: string = '';
  userRole: string = '';
  userData: { uid: string; email: string; role: string; } | null = null;
  private userSubscription: Unsubscribe | null = null; 

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  async ngOnInit() {
    this.authService.getCurrentUserWithRole().subscribe(userData => {
      if (userData) {
        this.userData = userData;
        this.userId = userData.uid;
        this.userRole = userData.role;
        this.userName = userData.email;
      }
    });
  }



  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth/login']); 
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription(); 
      this.userSubscription = null;
    }
  }
  

}

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
  private userSubscription: Unsubscribe | null = null; 


  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      const userData = await this.authService.getUserData(user.uid);
      this.userId = user.uid;
    }
  }



  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth/login']); // Redirigir al login después del logout
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription(); //  Appel correct de la fonction Unsubscribe
      this.userSubscription = null;
    }
  }
  

}

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

      /* ********************* Variables *********************** */

      userName: string = 'Utilisateur';
      isMenuOpen = false;
      userId: string = '';
      userRole: string = '';
      userData: { uid: string; email: string; role: string; } | null = null;
      private userSubscription: Unsubscribe | null = null;     

      /* ********************* Constructor *********************** */

  constructor(private authService: AuthService, private firestore: Firestore, private router: Router) { }

      /* ********************* Functions *********************** */

  /**
   * Change l'etat du menu (ouvert ou ferme).
   */
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * Recupere les informations de l'utilisateur connecte.
   * Met a jour les variables d'instance avec ces informations.
   * @returns {void}
   */
  async ngOnInit() {
    this.authService.getCurrentUserWithRole().subscribe(userData => {
      if (userData) { // si l'utilisateur est connecté
        this.userData = userData;
        this.userId = userData.uid;
        this.userRole = userData.role;
        this.userName = userData.email;
      }
    });
  }

  /**
   * Se deconnecte.
   * Supprime le jeton d'acc s enregistr  localement.
   * Redirige vers la page de connexion.
   * @returns {Promise<void>}
   */
  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth/login']); 
  }

  /**
   * Appel  lorsque le composant est d  truit.
   * Supprime l'abonnement l'observable qui  coute les changements de l'utilisateur connect .
   * @returns {void}
   */
  ngOnDestroy() {
    if (this.userSubscription) {// si l'utilisateur est connecté
      this.userSubscription(); 
      this.userSubscription = null;
    }
  }
}

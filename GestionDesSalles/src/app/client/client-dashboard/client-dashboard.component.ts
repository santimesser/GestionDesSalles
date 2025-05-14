import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../composants/header/header.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-client-dashboard',
  imports: [CommonModule, HeaderComponent, RouterModule, MatTabsModule],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.css'
})
export class ClientDashboardComponent  implements OnInit {

  /* ********************* Variables *********************** */

  userName: string = 'Utilisateur';
  userId: string = '';
  userRole: string = '';
  
  /* ********************* constructeur *********************** */

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /* ********************* fonctions *********************** */

  /**
   * Appel  lors de l'initialisation du composant.
   * - V rifie si l'utilisateur est connect .
   * - Si l'utilisateur est connect , recupere ses informations.
   * - Sinon, redirige vers la page de connexion.
   * @returns {Promise<void>}
   */
  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (user) {// si l'utilisateur est connecté
      const userData = await this.authService.getUserData(user.uid);
      this.userId = user.uid;
      this.userName = userData?.username || user.displayName || 'Utilisateur';
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Navigue vers la page de reservation.
   * @returns {void}
   */
  toggleReserver() {
    this.router.navigate(['/dashboard']);
  }
  
  /**
   * Navigue vers la page de gestion des reservations.
   * @returns {void}
   */
  toggleGestion() {
    this.router.navigate(['/gestion']);
  }
}
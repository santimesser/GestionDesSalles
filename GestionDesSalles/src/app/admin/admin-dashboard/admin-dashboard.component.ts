import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../composants/header/header.component';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTabsModule, HeaderComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {

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
   * Initialisation du composant.
   * - Verifie si l'utilisateur est connecte.
   * - Si l'utilisateur est connecte, recupere ses informations.
   * - Sinon, redirige vers la page de connexion.
   * @returns {Promise<void>}
   */
  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (user) {// si l'utilisateur est connecte
      const userData = await this.authService.getUserData(user.uid);
      this.userId = user.uid;
      this.userName = userData?.username || user.displayName || 'Utilisateur';
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Navigue vers la page des salles.
   * @returns {void}
   */
  toggleSalles() {
    this.router.navigate(['/salles']);
  }
  
  /**
   * Navigue vers la page des statistiques.
   * @returns {void}
   */
  toggleStatistiques() {
    this.router.navigate(['/statistiques']);
  }
}
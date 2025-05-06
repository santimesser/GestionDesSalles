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
  userName: string = 'Utilisateur';
  userId: string = '';
  userRole: string = '';
  

  constructor(
    private authService: AuthService,
    private router: Router
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
  }

  toggleReserver() {
    this.router.navigate(['/reserver']);
  }
  
  toggleGestion() {
    this.router.navigate(['/gestion']);
  }
}
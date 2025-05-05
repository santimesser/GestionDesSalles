import { Component, OnInit } from '@angular/core';
import { AuthService } from '../app/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../app/composants/header/header.component';
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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    // Redirection si l'utilisateur est admin
    const userWithRole = await firstValueFrom(this.authService.getCurrentUserWithRole());

    console.log('Utilisateur connecté :', userWithRole);


    if (userWithRole?.role === 'admin' && this.router.url !== '/admin') {
      this.router.navigate(['/admin']);
      return;
    }

    if (user) {
      const userData = await this.authService.getUserData(user.uid);
      this.userId = user.uid;
      this.userName = userData?.username || user.displayName || 'Utilisateur';
      
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}

import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AuthService } from '../app/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../app/composants/header/header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,
    HeaderComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {


  constructor(
    private authService: AuthService,
    private router: Router,
  ) { }
  userName: string = 'Utilisateur';
  userId: string = '';

  async ngAfterViewInit() {
  }

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



}

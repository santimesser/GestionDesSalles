import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from '@angular/fire/auth';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-setup-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './setup-profile.component.html',
  styleUrl: './setup-profile.component.css'
})
export class SetupProfileComponent implements OnInit {
  profileForm: FormGroup;
  errorMessage: string = '';
  errorMessageBool: boolean = false;
  selectedFilePreview: string | null = null;
  currentUser: User | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      username: ['', Validators.required]
    });
  }
  
  async ngOnInit() {
    this.currentUser = await this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }
  
    if (!this.currentUser.emailVerified) {
      this.router.navigate(['/auth/login']);
      return;
    }
  
    // Récupère les données utilisateur
    const userData = await this.authService.getUserData(this.currentUser.uid);
  
    if (userData?.username && userData.username.trim() !== '') {
      // Si le nom d'utilisateur existe déjà, redirection directe
      this.router.navigate(['/dashboard']);
      return;
    }
  
    // Pré-remplit le formulaire si partiellement rempli
    if (userData?.username) {
      this.profileForm.patchValue({ username: userData.username });
    }
  }

  /**
   * Enregistre uniquement le nom d'utilisateur et le rôle
   * sans écraser les autres champs comme prénom/nom/email
   */
  async onSubmit() {
    if (!this.profileForm.valid || !this.currentUser) return;

    const { username, role } = this.profileForm.value;

    try {
      await this.authService.saveUserProfile(
        this.currentUser.uid,
        username,
        'client'
      );

      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage = "Erreur lors de l'enregistrement du profil.";
      this.errorMessageBool = true;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  closeAlert() {
    this.errorMessageBool = false;
  }
}

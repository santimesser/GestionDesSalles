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

    /* ********************* Variables *********************** */

  profileForm: FormGroup;
  errorMessage: string = '';
  errorMessageBool: boolean = false;
  selectedFilePreview: string | null = null;
  currentUser: User | null = null;

    /* ********************* Constructor *********************** */

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      username: ['', Validators.required]
    });
  }
  
  /* ********************* Methods *********************** */

  /**
   * Méthode d'initialisation du composant.
   * Vérifie si l'utilisateur est connect , s'il est vérifié et s'il a un nom d'utilisateur défini.
   * Si le nom d'utilisateur existe déjà, redirige vers la page de dashboard.
   * Si le nom d'utilisateur est partiellement rempli, pré-remplit le formulaire.
   */
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
    const userData = await this.authService.getUserData(this.currentUser.uid);
    if (userData?.username && userData.username.trim() !== '') { // Si le nom d'utilisateur existe déjà, redirection directe
      this.router.navigate(['/dashboard']);
      return;
    }
    if (userData?.username) {// Si le nom d'utilisateur est partiellement rempli
      this.profileForm.patchValue({ username: userData.username });
    }
  }

/**
 * Soumet le formulaire de configuration de profil.
 * Vérifie la validité du formulaire et la présence de l'utilisateur actuel.
 * Sauvegarde le profil de l'utilisateur avec le nom d'utilisateur saisi
 * et le rôle 'client'.
 * Redirige vers le tableau de bord en cas de succès.
 * Affiche un message d'erreur en cas d'échec lors de l'enregistrement.
 */
  async onSubmit() {
    if (!this.profileForm.valid || !this.currentUser) return; // Vérifier si le formulaire est valide
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

/**
 * Déconnecte l'utilisateur actuel et le redirige vers la page de connexion.
 * Appelle la méthode de déconnexion du service d'authentification.
 */
  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Ferme l'alerte d'erreur en la cachant.
   */
  closeAlert() {
    this.errorMessageBool = false;
  }
}

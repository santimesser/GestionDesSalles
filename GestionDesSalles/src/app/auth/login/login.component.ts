import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  /* ********************* Variables *********************** */

  loginForm: FormGroup;
  errorMessage: string = '';
  errorMessageBool: boolean = false;
  isLoading: boolean = true;

    /* ********************* Constructeur *********************** */

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

    /* ********************* Fonctions *********************** */

  /**
   * Vérifie si l'utilisateur est déjà connecté et redirige si nécessaire
   */
  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (user) {// si l'utilisateur est deja connecte
      this.router.navigate(['/dashboard']);
    } 
    else {
      this.isLoading = false;
    }
  }


/**
 * Soumet le formulaire de connexion.
 * Vérifie la validité du formulaire et authentifie l'utilisateur via le service d'authentification.
 * Affiche un message de succès en cas de connexion réussie.
 * Affiche un message d'erreur et lève une exception en cas d'échec de la connexion.
 */
  async onSubmit() {
    if (this.loginForm.valid) {// Vérifier si le formulaire est valide
      try {
        await this.authService.login(
          this.loginForm.value.email,
          this.loginForm.value.password
        );
        this.snackBar.open('Connexion réussie !', 'Fermer', {
          duration: 3000,
          verticalPosition: 'bottom'
        });
      } catch (error) {
        this.errorMessage = this.handleError(error);
        this.errorMessageBool = true;
        this.snackBar.open('Erreur de connexion', 'Fermer', {
          duration: 3000,
          verticalPosition: 'bottom'
        });
        throw error;
      }
    }
  }

  /**
   * Connecte l'utilisateur avec Google.
   * Ouvre une fenêtre popup pour l'authentification Google.
   * Redirige l'utilisateur vers la page de configuration du profil si la connexion est réussie.
   * Affiche un message d'erreur et lève une exception en cas d'échec de la connexion.
   */
  async loginWithGoogle() {
    try {
      await this.authService.loginWithGoogle();
      this.snackBar.open('Connexion réussie !', 'Fermer', {
        duration: 3000,
        verticalPosition: 'bottom'
      });
  
      // Redirection ou autres logiques...
    } catch (error) {
      this.snackBar.open('Erreur de connexion', 'Fermer', {
        duration: 3000,
        verticalPosition: 'bottom'
      });
      this.errorMessage = "Erreur lors de la connexion avec Google.";
      this.errorMessageBool = true;
      throw error;
    }
  }

  /**
   * Ferme l'alerte d'erreur
   */
  closeAlert() {
    this.errorMessageBool = false;
  }

  /**
   * Redirection vers la page d'inscription
   */
  goToRegister() {
    this.router.navigate(['/auth/register']);
  }

  /**
   * Redirection vers la page de réinitialisation du mot de passe
   */
  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  /**
   * Redirection vers la page de dashboard
   */
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

/**
 * Gère les erreurs d'authentification et renvoie un message d'erreur approprié.
 * 
 * @param error L'erreur à traiter, de type inconnu.
 * @returns Un message d'erreur correspondant au type d'erreur fourni.
 * Si l'erreur est liée à des informations d'identification invalides,
 * un message spécifique est renvoyé. Sinon, un message générique est renvoyé.
 */
  handleError(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const msg = (error as Error).message;
      if (msg.includes('auth/invalid-credential')) {
        return "Email ou mot de passe incorrect.";
      }
    }
    return "Une erreur est survenue. Veuillez réessayer.";
  }
}

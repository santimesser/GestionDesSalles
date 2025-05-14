import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

        /* ********************* Variables *********************** */

  registerForm: FormGroup;
  errorMessage: string = '';
  errorMessageBool: boolean = false;
  successMessage: string = '';
  successMessageBool: boolean = false;

        /* ********************* Constructeur *********************** */

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({ // Formulaire d'inscription avec validation
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

        /* ********************* Fonctions *********************** */

  /**
   * Valideur pour les mots de passe.
   * Vérifie si les mots de passe sont identiques.
   * Si les mots de passe sont identiques, renvoie null.
   * Sinon, renvoie un objet avec la cl , { mismatch: true }.
   * @param form Formulaire d'inscription.
   * @returns null si les mots de passe sont identiques, un objet avec la cl  { mismatch: true } sinon.
   */
  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  /**
   * Soumettre le formulaire d'inscription.
   * Vérifie la validité du formulaire et l'envoie au service d'authentification.
   * Affiche un message de succès en cas de succès.
   * Affiche un message d'erreur en cas d'échec.
   */
  async onSubmit() {
    this.errorMessage = '';
    if (this.registerForm.valid) {// Vérifier si le formulaire est valide
      try {
        const { email, password, first_name, last_name } = this.registerForm.value;
        await this.authService.register(email, password, first_name, last_name);
        this.successMessage = "Un email a été envoyé à votre adresse pour vérifier votre compte. Vous serez redirigé vers la page de connexion.";
        this.successMessageBool = true;

        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 4000);
      } catch (error: any) {
        this.handleAuthErrors(error.code);
      }
    }
  }
  
  /**
   * Affiche un message d'erreur approprié en fonction du code d'erreur retourné par Firebase.
   * @param errorCode Code d'erreur retourné par Firebase.
   */
  handleAuthErrors(errorCode: string) {
    this.errorMessageBool = true;
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Cet email est déjà utilisé.',
      'auth/invalid-email': "L'email n'est pas valide.",
      'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
      'USERNAME_ALREADY_TAKEN': "Ce nom d'utilisateur est déjà pris."
    };
    this.errorMessage = errorMessages[errorCode] || 'Une erreur est survenue. Veuillez réessayer.';
  }

  /**
   * Ferme l'alerte d'erreur
   */
  closeAlert() {
    this.errorMessageBool = false;
  }

  /**
   * Redirection vers la page de connexion
   */
  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Redirection vers la page de dashboard
   */
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Connexion avec Google
   */
  async signInWithGoogle() {
    await this.authService.loginWithGoogle();
  }
}

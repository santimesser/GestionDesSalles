import { Component, OnInit } from '@angular/core';
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
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage: string = '';
  errorMessageBool: boolean = false;
  successMessage: string = '';
  successMessageBool: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void { }

  /**
   * Vérifie que les mots de passe correspondent
   */
  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  /**
   * Soumet le formulaire d'inscription
   */
  async onSubmit() {
    this.errorMessage = '';
    if (this.registerForm.valid) {
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
   * Affiche un message d'erreur en fonction du code Firebase
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

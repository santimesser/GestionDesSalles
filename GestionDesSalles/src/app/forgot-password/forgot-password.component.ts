import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { sendPasswordResetEmail, Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {

    /* ********************* Variables *********************** */

  email: string = '';
  message: string = '';
  messageBool: boolean = false;

    /* ********************* Constructor *********************** */

  constructor(private auth: Auth, private router: Router) {}

  /* ********************* Functions *********************** */

  /**
   * Envoie un email de réinitialisation
   */
  async sendResetEmail() {
    try {
      await sendPasswordResetEmail(this.auth, this.email);
      this.message = 'Email de réinitialisation envoyé. Veuillez vérifier votre boîte de réception.';
      this.messageBool = true;
    } catch (error) {
      this.message = 'Une erreur est survenue. Vérifiez votre adresse email.';
      this.messageBool = true;
    }
  }

  /**
   * Ferme l'alerte
   */
  closeAlert() {
    this.messageBool = false;
  }

  /**
   * Redirection vers la page de connexion
   */
  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}

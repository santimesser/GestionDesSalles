import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {

    /* ********************* Constructor *********************** */

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

    /* ********************* Fonctions *********************** */

  /**
   * Redirige l'utilisateur vers la page de connexion si il n'est pas connect.
   * Redirige l'utilisateur vers la page de setup du profil si son email n'est pas verifie
   * ou si son profile n'est pas complete.
   * @returns Un boolean indiquant si l'utilisateur peut acceder a la route.
   */
  async canActivate(): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) {
      this.router.navigate(['/auth/login']);
      return false;
    }
    if (!user.emailVerified) {
      this.router.navigate(['/auth/login']);
      return false;
    }
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      this.router.navigate(['/setup-profile']);
      return false;
    }
    const data = docSnap.data();
    if (!data['username'] || data['username'].trim() === '') {
      this.router.navigate(['/setup-profile']);
      return false;
    }
    return true;
  }
}


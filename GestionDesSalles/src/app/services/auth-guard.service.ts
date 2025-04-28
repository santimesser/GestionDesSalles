import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  /**
   * Vérifie si l'utilisateur est connecté et possède un nom d'utilisateur
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


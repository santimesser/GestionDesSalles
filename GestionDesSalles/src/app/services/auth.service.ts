import { Injectable, inject } from '@angular/core';
import { firstValueFrom, switchMap, Observable, of  } from 'rxjs';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from '@angular/fire/auth';

import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  docData 
} from '@angular/fire/firestore';

import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  /**
   * Enregistre un nouvel utilisateur avec rôle 'client' uniquement.
   */
  async register(email: string, password: string, firstName: string, lastName: string): Promise<void> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(this.firestore, `users/${user.uid}`), {
      email,
      first_name: firstName,
      last_name: lastName,
      role: 'client' // rôle forcé
    });

    await sendEmailVerification(user);
    await signOut(this.auth);
  }

  /**
   * Connexion avec vérification de l'email
   */
  async login(email: string, password: string): Promise<void> {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    const user = userCredential.user;



    if (!user.emailVerified) {
      await signOut(this.auth);
      throw new Error("Veuillez vérifier votre adresse email.");
    }

    const userData = await this.getUserData(user.uid);


    if (!userData || !userData.username || userData.username.trim() === '') {
      this.router.navigate(['/setup-profile']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Connexion via Google - redirection systématique vers setup-profile
   */
  async loginWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
  
      const userRef = doc(this.firestore, `users/${user.uid}`);
      const userSnap = await getDoc(userRef);
  
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          first_name: user.displayName?.split(' ')[0] || '',
          last_name: user.displayName?.split(' ')[1] || '',
          username: '',
          role: 'client'
        });
      }
  
      this.router.navigate(['/setup-profile']);
      
    } catch (error) {
      console.error('Erreur lors de la connexion Google :', error);
      throw error;
    }
  }

  /**
   * Récupère les données utilisateur dans Firestore
   */
  async getUserData(uid: string): Promise<any> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() : null;
  }

  /**
   * Sauvegarde le nom d'utilisateur et le rôle (fusionne avec le reste)
   */
  async saveUserProfile(uid: string, username: string, role: string): Promise<void> {
    const userRef = doc(this.firestore, `users/${uid}`);
    await setDoc(userRef, {
      username,
    }, { merge: true });
  }

  /**
   * Déconnecte l'utilisateur
   */
  async logout(): Promise<void> {
    return await signOut(this.auth);
  }

  /**
   * Récupère l'utilisateur actuellement connecté
   */
  getCurrentUser(): Promise<User | null> {
    return firstValueFrom(authState(this.auth));
  }

  getCurrentUserWithRole(): Observable<{ uid: string, email: string, role: string } | null> {
    return authState(this.auth).pipe(
      switchMap(user => {
        if (user) {
          const userDoc = doc(this.firestore, `users/${user.uid}`);
          return docData(userDoc) as Observable<{ uid: string, email: string, role: string }>;
        } else {
          return of(null);
        }
      })
    );
  }

}

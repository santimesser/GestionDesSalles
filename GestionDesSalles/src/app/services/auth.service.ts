import { Injectable } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
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
import { firstValueFrom, switchMap, Observable, of, map  } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  /* ********************* Constructor *********************** */
  
  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  /* ********************* Functions *********************** */

/**
 * Registers a new user with the provided email, password, first name, and last name.
 * - Creates a new user account in Firebase Authentication.
 * - Stores user details in Firestore with a default role of 'client'.
 * - Sends a verification email to the new user's email address.
 * - Signs out the user after registration to prevent automatic login.
 * 
 * @param email The email address of the new user.
 * @param password The password for the new user.
 * @param firstName The first name of the new user.
 * @param lastName The last name of the new user.
 */
  async register(email: string, password: string, firstName: string, lastName: string): Promise<void> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password); // Fonction de Firebase pour enregistrer un nouvel utilisateur avec email et mot de passe
    const user = userCredential.user;
    await setDoc(doc(this.firestore, `users/${user.uid}`), {
      email,
      first_name: firstName,
      last_name: lastName,
      role: 'client' // rôle forcé
    });
    await sendEmailVerification(user); // Envoi de l'email de verification
    await signOut(this.auth); // Deconnexion apres inscription pour eviter de se connecter automatiquement
  }

  /**
   * Connecte un utilisateur avec un email et un mot de passe.
   * - Vérifie si l'email est vérifié, sinon déconnecte l'utilisateur et lance une erreur.
   * - Récupère les données utilisateur depuis Firestore.
   * - Redirige vers la page de configuration du profil si le nom d'utilisateur est manquant.
   * - Redirige vers le tableau de bord si le nom d'utilisateur est présent.
   * 
   * @param email L'email de l'utilisateur.
   * @param password Le mot de passe de l'utilisateur.
   * @throws {Error} Si l'email n'est pas vérifié.
   */
  async login(email: string, password: string): Promise<void> {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password); // Fonction de Firebase pour se connecter avec email et mot de passe
    const user = userCredential.user;
    if (!user.emailVerified) { // Si l'email n'est pas verifie
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
 * Connecte un utilisateur en utilisant Google comme fournisseur d'identité.
 * - Ouvre une fenêtre popup pour l'authentification Google.
 * - Récupère les informations de l'utilisateur après la connexion.
 * - Vérifie si l'utilisateur existe déjà dans Firestore.
 * - Crée un nouvel utilisateur dans Firestore avec un rôle par défaut "client" si l'utilisateur n'existe pas.
 * - Redirige l'utilisateur vers la page de configuration du profil.
 * 
 * @throws {Error} Si une erreur survient lors de la connexion avec Google.
 */
  async loginWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider); // Fonction de Firebase pour se connecter avec Google
      const user = result.user;
      const userRef = doc(this.firestore, `users/${user.uid}`);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) { // Si l'utilisateur n'existe pas
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
   * Récupère les informations de l'utilisateur enregistrées dans Firestore,
   * identifié par son UID. Retourne un objet contenant les champs de l'utilisateur
   * s'il existe, sinon null.
   * 
   * @param uid Identifiant unique de l'utilisateur
   * @returns Promise de l'objet contenant les champs de l'utilisateur
   */
  async getUserData(uid: string): Promise<any> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() : null;
  }

  /**
   * Sauvegarde le profil de l'utilisateur enregistré dans Firestore.
   * Mise à jour des champs 'username' et 'role' de l'utilisateur.
   * 
   * @param uid Identifiant unique de l'utilisateur
   * @param username Nom d'utilisateur
   * @param role Rôle de l'utilisateur
   * @returns Promesse qui se résout lorsque la mise à jour est terminée
   */
  async saveUserProfile(uid: string, username: string, role: string): Promise<void> {
    const userRef = doc(this.firestore, `users/${uid}`);
    await setDoc(userRef, {
      username,
    }, { merge: true });
  }

  /**
   * Déconnecte l'utilisateur actuel et supprime son jeton d'accès
   * enregistré localement.
   * 
   * @returns Promesse qui se résout lorsque la déconnexion est terminée
   */
  async logout(): Promise<void> {
    return await signOut(this.auth);
  }

  /**
   * Récupère l'utilisateur actuellement authentifié.
   * 
   * @returns Promesse qui se résout avec l'objet utilisateur s'il est connecté,
   * sinon null.
   */
  getCurrentUser(): Promise<User | null> {
    return firstValueFrom(authState(this.auth));
  }

  /**
   *********************************** Function developpee par ChatGPT ***********************************
   * Récupère l'utilisateur actuellement authentifié et son rôle.
   * Retourne un objet observable contenant les champs 'uid', 'email' et 'role'
   * si l'utilisateur est connecté, sinon null.
   * Le champ 'role' est récupéré depuis Firestore.
   * 
   * @returns Observable qui se résout avec l'objet utilisateur s'il est connecté,
   * sinon null.
   *********************************** Function developpee par ChatGPT ***********************************
   */
   getCurrentUserWithRole(): Observable<{ uid: string, email: string, role: string } | null> {
    return authState(this.auth).pipe(
      switchMap(user => {
        if (user == null) return of(null);

        const userRef = doc(this.firestore, `users/${user.uid}`);
        return docData(userRef).pipe(
          map((userData: any) => {
            if (!userData?.role) return null;
            
            return {
              uid: user.uid,
              email: user.email || '',
              role: userData.role
            };
          })
        );
      })
    );
  }    
}

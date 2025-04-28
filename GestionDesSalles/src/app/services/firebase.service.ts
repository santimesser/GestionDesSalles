import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { doc, setDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor(private firestore: Firestore, private auth: Auth) {}

  
  async addUser() {
    
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      console.error(" Erreur : Aucun utilisateur connecté !");
      return;
    }

    const userId = currentUser.uid;
    const usersCollection = collection(this.firestore, 'users');

    await setDoc(doc(usersCollection, userId), {
      name: "Test User",
      email: currentUser.email,
      created_at: new Date()
    });

    console.log(" Utilisateur ajouté avec succès !");
  }

  async getUsers() {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      console.error(" Erreur : Aucun utilisateur connecté !");
      return;
    }
    const userId = currentUser.uid;
    const usersCollection = collection(this.firestore, 'users');
    const snapshot = await getDocs(usersCollection);
    snapshot.forEach(doc => {
      console.log(` ${doc.id} =>`, doc.data());
    });
  }
}

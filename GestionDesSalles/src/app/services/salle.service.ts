import { Injectable } from '@angular/core';
import { Firestore, collection, setDoc, doc, updateDoc, deleteDoc, collectionData, docData, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Salle } from '../models/sales.models';

@Injectable({
  providedIn: 'root'
})
export class SalleService {

  constructor(private firestore: Firestore) {}

  /**
   * Ajouter une nouvelle salle dans Firestore
   */
  ajouterSalle(salle: Salle): Promise<void> {
    const sallesRef = collection(this.firestore, 'rooms'); // ajusté selon la structure Firestore
    const docRef = doc(sallesRef); // crée un document avec un uid automatique
    return setDoc(docRef, { ...salle, uid: docRef.id });
  }

  /**
   * Modifier une salle existante
   */
  modifierSalle(uid: string, salle: Partial<Salle>): Promise<void> {
    const salleRef = doc(this.firestore, `rooms/${uid}`);
    return updateDoc(salleRef, salle);
  }

  /**
   * Supprimer une salle existante
   */
  supprimerSalle(uid: string): Promise<void> {
    const salleRef = doc(this.firestore, `rooms/${uid}`);
    return deleteDoc(salleRef);
  }

  /**
   * Lister toutes les salles existantes
   */
  listerSalles(currentUserUid: string): Observable<Salle[]> {
    const sallesRef = collection(this.firestore, 'rooms');
    const q = query(sallesRef, where('created_by', '==', currentUserUid));
    return collectionData(q, { idField: 'uid' }) as Observable<Salle[]>;
  }

  /**
   * Récupérer une salle spécifique par UID
   */
  getSalle(uid: string): Observable<Salle> {
    const salleRef = doc(this.firestore, `rooms/${uid}`);
    return docData(salleRef, { idField: 'uid' }) as Observable<Salle>;
  }
  
}

import { Injectable } from '@angular/core';
import { Firestore, collection, setDoc, doc, updateDoc, deleteDoc, collectionData, docData, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Salle } from '../models/sales.models';

@Injectable({
  providedIn: 'root'
})
export class SalleService {

    /* ********************* Constructor *********************** */

  constructor(private firestore: Firestore) {}

    /* ********************* Functions *********************** */

  /**
   * Ajoute une nouvelle salle à la base de données Firestore.
   * 
   * @param salle Objet contenant les champs de la salle à ajouter
   * @returns Promise qui se résout lorsque l'ajout est terminé
   */
  ajouterSalle(salle: Salle): Promise<void> {
    const sallesRef = collection(this.firestore, 'rooms'); // ajusté selon la structure Firestore
    const docRef = doc(sallesRef); // crée un document avec un uid automatique
    return setDoc(docRef, { ...salle, uid: docRef.id });
  }

  /**
   * Modifie une salle existante dans Firestore avec les nouvelles données fournies.
   * 
   * @param uid Identifiant unique de la salle à modifier
   * @param salle Objet contenant les champs à mettre à jour pour la salle
   * @returns Promise qui se résout lorsque la mise à jour est terminée
   */
  modifierSalle(uid: string, salle: Partial<Salle>): Promise<void> {
    const salleRef = doc(this.firestore, `rooms/${uid}`);
    return updateDoc(salleRef, salle);
  }


  /**
   * Supprime une salle dans Firestore.
   * 
   * @param uid Identifiant de la salle à supprimer
   * @returns Promise qui se résout lorsque la suppression est terminée
   */
  supprimerSalle(uid: string): Promise<void> {
    const salleRef = doc(this.firestore, `rooms/${uid}`);
    return deleteDoc(salleRef);
  }

  /**
   * Liste toutes les salles disponibles dans Firestore.
   * 
   * @param currentUserUid Identifiant de l'utilisateur actuel (non utilisé dans cette fonction)
   * @returns Observable d'un tableau de salles, chaque salle étant identifiée par son UID
   */
  listerSalles(currentUserUid: string): Observable<Salle[]> {
    const sallesRef = collection(this.firestore, 'rooms');
    const q = query(sallesRef);
    return collectionData(q, { idField: 'uid' }) as Observable<Salle[]>;
  }

  /**
   * Obtenir une salle existante par son identifiant
   * @param uid Identifiant de la salle
   * @returns Observable de la salle
   */
  getSalle(uid: string): Observable<Salle> {
    const salleRef = doc(this.firestore, `rooms/${uid}`);
    return docData(salleRef, { idField: 'uid' }) as Observable<Salle>;
  }
}

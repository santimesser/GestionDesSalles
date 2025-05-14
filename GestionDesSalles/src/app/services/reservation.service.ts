import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  getDoc,
  getDocs,
  query,
  DocumentReference,
  where,
  deleteDoc
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Timestamp } from '@angular/fire/firestore';
import { Observable, from, switchMap, map, mergeMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReservationService {

  /* ********************* Constructor *********************** */
  constructor(private firestore: Firestore, private auth: Auth) { }

  /* ********************* Functions *********************** */

  /**
   *********************************** Function developpee par ChatGPT ***********************************
   * Retourne un tableau contenant les réservations de l'utilisateur actuel, toutes détaillées.
   * Les réservations sont filtrées en fonction de l'utilisateur actuel : si l'utilisateur n'est pas
   * un administrateur, seules les réservations qu'il a créées sont retournées. Si l'utilisateur
   * est un administrateur, toutes les réservations sont retournées.
   * Les réservations sont détaillées en incluant les informations de la salle, de l'utilisateur qui
   * a créé la réservation, de la date de début et de fin, de la disposition et de la liste des
   * équipements.
   * @returns Observable qui se résout en un tableau de réservations détaillées
   *********************************** Function developpee par ChatGPT ***********************************
   */
  getAllReservations(): Observable<any[]> {
    const reservationsRef = collection(this.firestore, 'reservations');
    return user(this.auth).pipe(
      switchMap(authUser => {
        if (!authUser) return from(Promise.resolve([]));
        const uidAdmin = authUser.uid;
        return collectionData(reservationsRef, { idField: 'uid' }).pipe(
          switchMap((reservations: any[]) => {
            const detailedReservations$ = reservations.map(async reservation => {
              try {
                const roomSnap = await getDoc(reservation.room_id);
                if (!roomSnap.exists()) return null;
                const roomData = roomSnap.data() as { created_by: string; name?: string };
                if (roomData['created_by'] !== uidAdmin) return null;
                let userRef = typeof reservation.user_id === 'string'
                  ? doc(this.firestore, `users/${reservation.user_id}`)
                  : reservation.user_id;
                const userSnap = await getDoc(userRef);
                const equipmentRef = collection(this.firestore, `reservations/${reservation.uid}/equipment`);
                const equipmentSnap = await getDocs(equipmentRef);
                const equipment = equipmentSnap.docs.map(doc => doc.data());
                return {
                  ...reservation,
                  user: userSnap.exists() ? userSnap.data() : null,
                  room: roomSnap.exists() ? roomSnap.data() : null,
                  startDate: reservation.start_date.toDate?.() ?? reservation.start_date,
                  endDate: reservation.end_date.toDate?.() ?? reservation.end_date,
                  equipment,
                  disposition: reservation.disposition
                };
              } catch (e) {
                console.error('Erreur lors du traitement de la réservation :', e);
                return null;
              }
            });
            return from(Promise.all(detailedReservations$)).pipe(
              switchMap(resList => from(Promise.resolve(resList.filter(r => r !== null))))
            );
          })
        );
      })
    );
  }

  /**
   * Retourne un objet contenant les stats des équipements réservés
   * pour un mois et une année donnés.
   * Les clés sont les IDs des équipements et les valeurs sont le nombre
   * de fois où l'équipement a été réservé pour le mois et l'année
   * donnés.
   * @param month mois pour lequel on veut les stats (0 = janvier, 1 = février, etc.)
   * @param year année pour laquelle on veut les stats
   * @returns Observable qui se résout en un objet contenant les stats
   */
  getEquipmentStatsByMonthYear(month: number, year: number): Observable<{ [key: string]: number }> {
    const reservationsRef = collection(this.firestore, 'reservations');
    return collectionData(reservationsRef, { idField: 'uid' }).pipe(
      switchMap(async (reservations: any[]) => {

        const stats: { [key: string]: number } = {};
        const monthInt = Number(month);
        const yearInt = Number(year);

        for (const res of reservations) {
          const rawDate = res.start_date;
          const date = rawDate?.toDate?.() ?? new Date(rawDate); 

          if (date.getMonth() !== monthInt || date.getFullYear() !== yearInt) { // si la date de la reservation n'est pas dans le mois et l'annee donne on continue
            continue;
          }

          const equipPath = `reservations/${res.uid}/equipment`;
          const equipRef = collection(this.firestore, equipPath);
          const equipDocs = await getDocs(equipRef);

          equipDocs.forEach(docSnap => { // pour chaque equipement de la reservation on ajoute 1 au compteur
            const equipData = docSnap.data();
            const equipRef = equipData['equipment_id'];
            if (!equipRef || !equipRef.path) return; // si l'equipement n'est pas dans la reservation on continue
            
            const id = equipRef.path.split('/')[1];
            stats[id] = (stats[id] || 0) + 1;
          });
        }
        return stats;
      })
    );
  }

  /**
   *********************************** Function developpee par ChatGPT ***********************************
   * Renvoie un tableau contenant les réservations de l'utilisateur actuel, toutes détaillées.
   * Les réservations sont détaillées en incluant les informations de la salle, de l'utilisateur qui
   * a créé la réservation, de la date de début et de fin, de la disposition et de la liste des
   * équipements.
   * @param userId Identifiant de l'utilisateur pour lequel on veut les réservations
   * @returns Observable qui se résout en un tableau de réservations détaillées
   *********************************** Function developpee par ChatGPT ***********************************
   */
  getReservationsForUser(userId: string): Observable<any[]> {
    const reservationsRef = collection(this.firestore, 'reservations');
    const userRef = doc(this.firestore, `users/${userId}`);
    const q = query(reservationsRef, where('user_id', '==', userRef));
    return collectionData(q, { idField: 'uid' }).pipe(
      mergeMap((reservations: any[]) =>
        from(Promise.all(reservations.map(async reservation => {
          try {
            const roomSnap = await getDoc(reservation.room_id);
            const userSnap = await getDoc(userRef);
            const equipmentRef = collection(this.firestore, `reservations/${reservation.uid}/equipment`);
            const equipmentSnap = await getDocs(equipmentRef);
            // Traiter les équipements
            const equipment: any[] = await Promise.all(
              equipmentSnap.docs.map(async (docSnap) => {
                const data = docSnap.data();
                const equipmentIdPath = data['equipment_id'];
                const equipmentDocRef = typeof equipmentIdPath === 'string'
                  ? doc(this.firestore, equipmentIdPath)
                  : equipmentIdPath;
                try {
                  const equipmentDoc = await getDoc(equipmentDocRef);
                  const equipmentData = equipmentDoc.exists()
                    ? equipmentDoc.data() as { name: string; extra_price: number }
                    : { name: 'Inconnu', extra_price: 0 };
                  return {
                    name: equipmentData.name,
                    price: equipmentData.extra_price
                  };
                } catch (err) {
                  console.error(' Erreur sur équipement:', err);
                  return { name: 'Erreur', price: 0 };
                }
              })
            );
            const roomData = roomSnap.exists()
              ? roomSnap.data() as {
                name: string;
                price_per_day: number;
                area?: number;
                capacity_seated?: number;
                capacity_total?: number;
                equipment_description?: string;
              }
              : {
                name: 'Salle inconnue',
                price_per_day: 0
              };
            const total_price =
              roomData.price_per_day +
              equipment.reduce((sum, eq) => sum + (Number(eq.price) || 0), 0);
            return {
              ...reservation,
              user: userSnap.exists() ? userSnap.data() : null,
              room: roomData,
              startDate: reservation.start_date.toDate?.() ?? reservation.start_date,
              endDate: reservation.end_date.toDate?.() ?? reservation.end_date,
              equipment,
              disposition: reservation.disposition,
              total_price
            };
          } catch (e) {
            console.error('Erreur lors de la récupération de la réservation:', e);
            return null;
          }
        })))
      ),
      map(results => results.filter(res => res !== null))
    );
  }

  /**
   * Retourne un objet contenant pour chaque salle, le nombre de réservations
   * pour chaque jour. Le format de l'objet est le suivant:
   * {
   *   [roomName: string]: {
   *     [dateStr: string]: number
   *   }
   * }
   * Les clés sont les noms de salles, et les valeurs sont des objets qui contiennent
   * les dates au format ISO (YYYY-MM-DD) en clés et le nombre de réservations
   * pour cette date en valeur.
   * @returns {Observable<{ [roomName: string]: { [dateStr: string]: number } }>}
   */
  getReservationsCountPerDayByRoom(): Observable<{ [roomName: string]: { [dateStr: string]: number } }> {
    const reservationsRef = collection(this.firestore, 'reservations');
    const result$ = collectionData(reservationsRef, { idField: 'uid' }).pipe( // idField: 'uid' pour obtenir l'identifiant de la reservation

      switchMap(async (reservations: any[]) => {
        const result: { [room: string]: { [dateStr: string]: number } } = {};

        for (const res of reservations) {
          const rawDate = res.start_date;
          const date: Date = rawDate?.toDate?.() ?? new Date(rawDate);
          const dateStr = date.toISOString().split('T')[0];
          const roomRefPath = res.room_id?.path;
          let roomName = 'Inconnue';

          if (roomRefPath) { // si el path de la salle existe
            try {
              const roomSnap = await getDoc(doc(this.firestore, roomRefPath));
              if (roomSnap.exists()) {// si dans le path de la salle il y a quelque chose
                roomName = roomSnap.data()['name'] || 'Inconnue';
              }
            } catch (e) {
              console.warn('Erreur lors de la récupération de la salle:', e);
            }
          }
          result[roomName] = result[roomName] || {};
          result[roomName][dateStr] = (result[roomName][dateStr] || 0) + 1;
        }
        return result;
      })
    );
    return result$;
  }

  /**
   * Supprime une réservation en base de données, y compris tous ses équipements.
   * 
   * @param reservationId Identifiant de la réservation à supprimer
   * @returns Une promesse qui se résout lorsque la suppression est terminée
   */
  supprimerReservation(reservationId: string): Promise<void> {
    const reservationRef = doc(this.firestore, `reservations/${reservationId}`);
    const equipementsRef = collection(this.firestore, `reservations/${reservationId}/equipment`);

    const promesseSuppression = getDocs(equipementsRef).then(snapshot => { // Recupere tous les equipements
      const toutesLesSuppressions = snapshot.docs.map(unEquipement => { // Supprime tous les equipements
        const equipementRef = doc(this.firestore, `reservations/${reservationId}/equipment/${unEquipement.id}`);
        return deleteDoc(equipementRef);
      });
      return Promise.all(toutesLesSuppressions).then(() => {
        return deleteDoc(reservationRef);
      });
    });
    return promesseSuppression;
  }
}

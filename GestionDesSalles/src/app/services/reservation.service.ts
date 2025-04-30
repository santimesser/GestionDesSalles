import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, getDoc } from '@angular/fire/firestore';
import { Observable, from, switchMap, map } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { user } from 'rxfire/auth';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  constructor(private firestore: Firestore, private auth: Auth) {}

  /**
   * Récupère uniquement les réservations des salles créées par l'admin connecté.
   */
  getAllReservations(): Observable<any[]> {
    const reservationsRef = collection(this.firestore, 'reservations');

    return user(this.auth).pipe(
      switchMap(authUser => {
        if (!authUser) {
          console.warn('Aucun utilisateur connecté.');
          return from(Promise.resolve([]));
        }

        const uidAdmin = authUser.uid;
        console.log('UID de l’admin connecté :', uidAdmin);

        return collectionData(reservationsRef, { idField: 'uid' }).pipe(
          switchMap((reservations: any[]) => {
            console.log('Réservations récupérées :', reservations);

            const filteredReservations = reservations.map(async reservation => {
              try {
                const roomPath = reservation.room_id?.path;
                const userPath = reservation.user_id?.path;

                if (!roomPath || !userPath) {
                  console.warn('Référence invalide dans la réservation :', reservation);
                  return null;
                }

                const roomSnap = await getDoc(doc(this.firestore, roomPath));
                if (!roomSnap.exists()) {
                  console.warn('Salle non trouvée pour la réservation :', reservation);
                  return null;
                }

                const roomData = roomSnap.data();
                if (roomData['created_by'] !== uidAdmin) {
                  console.log(`Salle ignorée (non créée par l’admin) : ${roomData['name']}`);
                  return null;
                }

                const userSnap = await getDoc(doc(this.firestore, userPath));
                const userData = userSnap.exists() ? userSnap.data() : null;

                return {
                  ...reservation,
                  user: userData,
                  room: roomData,
                  startDate: reservation.start_date.toDate?.() ?? reservation.start_date,
                  endDate: reservation.end_date.toDate?.() ?? reservation.end_date
                };

              } catch (error) {
                console.error('Erreur lors du traitement d’une réservation :', error);
                return null;
              }
            });

            return from(Promise.all(filteredReservations)).pipe(
              map(results => results.filter(res => res !== null))
            );
          })
        );
      })
    );
  }
}

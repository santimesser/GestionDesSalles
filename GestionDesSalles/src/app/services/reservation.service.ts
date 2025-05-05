import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  getDoc,
  getDocs,
  DocumentReference
} from '@angular/fire/firestore';
import { Observable, from, switchMap, map, mergeMap } from 'rxjs';
import { Auth, user } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  constructor(private firestore: Firestore, private auth: Auth) { }

  /**
   * Récupère toutes les réservations avec informations utilisateur, salle et équipements.
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

                const userSnap = await getDoc(reservation.user_id);
                const equipmentRef = collection(this.firestore, `reservations/${reservation.uid}/equipment`);
                const equipmentSnap = await getDocs(equipmentRef);

                const equipment = equipmentSnap.docs.map(doc => doc.data());


                return {
                  ...reservation,
                  user: userSnap.exists() ? userSnap.data() : null,
                  room: roomData,
                  startDate: reservation.start_date.toDate?.() ?? reservation.start_date,
                  endDate: reservation.end_date.toDate?.() ?? reservation.end_date,
                  equipment
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
   * Statistiques des équipements optionnels utilisés ce mois.
   * On lit toutes les réservations et leur sous-collection "equipment".
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
  
  
          if (date.getMonth() !== monthInt || date.getFullYear() !== yearInt) {
            continue;
          }
  
          const equipPath = `reservations/${res.uid}/equipment`;
          const equipRef = collection(this.firestore, equipPath);
          const equipDocs = await getDocs(equipRef);
  
          equipDocs.forEach(docSnap => {
            const equipData = docSnap.data();
            const equipRef = equipData['equipment_id'];
            if (!equipRef || !equipRef.path) return;
  
            const id = equipRef.path.split('/')[1];
            stats[id] = (stats[id] || 0) + 1;
          });
        }
  
        return stats;
      })
    );
  }

  getReservationsCountPerDayByRoom(): Observable<{
    [roomName: string]: { [dateStr: string]: number }
  }> {
    const reservationsRef = collection(this.firestore, 'reservations');
  
    return collectionData(reservationsRef, { idField: 'uid' }).pipe(
      switchMap(async (reservations: any[]) => {
        const result: { [room: string]: { [dateStr: string]: number } } = {};
  
        console.log('→ Toutes les réservations:', reservations);
  
        for (const res of reservations) {
          const rawDate = res.start_date;
          const date: Date = rawDate?.toDate?.() ?? new Date(rawDate);
          const dateStr = date.toISOString().split('T')[0];
  
          // Charger les données de la salle
          const roomRefPath = res.room_id?.path;
          let roomName = 'Inconnue';
          if (roomRefPath) {
            try {
              const roomSnap = await getDoc(doc(this.firestore, roomRefPath));
              if (roomSnap.exists()) {
                roomName = roomSnap.data()['name'] || 'Inconnue';
              }
            } catch (e) {
              console.warn('Erreur lors de la récupération de la salle:', e);
            }
          }
  
          console.log(`→ Réservation: salle = ${roomName}, date = ${dateStr}`);
  
          if (!result[roomName]) result[roomName] = {};
          if (!result[roomName][dateStr]) result[roomName][dateStr] = 0;
  
          result[roomName][dateStr]++;
        }
  
        console.log('→ Résultat final des statistiques par salle:', result);
        return result;
      })
    );
  }
  
  
  
}

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
import { Observable, from, switchMap, map, mergeMap } from 'rxjs';
import { Auth, user } from '@angular/fire/auth';
import { Timestamp } from '@angular/fire/firestore';

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

  /**
 * Supprime une réservation et ses équipements associés
 */
  supprimerReservation(reservationId: string): Promise<void> {
    const reservationDocRef = doc(this.firestore, `reservations/${reservationId}`);
    const equipmentCollectionRef = collection(this.firestore, `reservations/${reservationId}/equipment`);

    return getDocs(equipmentCollectionRef).then(snapshot => {
      const deletes = snapshot.docs.map(docSnap =>
        deleteDoc(doc(this.firestore, `reservations/${reservationId}/equipment/${docSnap.id}`))
      );

      return Promise.all(deletes).then(() => deleteDoc(reservationDocRef));
    });
  }

  async getAvailableRoomsForDate(date: Date): Promise<any[]> {
    const roomsSnap = await getDocs(collection(this.firestore, 'rooms'));
    const allRooms = roomsSnap.docs.map(doc => ({ ref: doc.ref, data: doc.data() }));
  
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
  
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
  
    const reservationsSnap = await getDocs(query(
      collection(this.firestore, 'reservations'),
      where('start_date', '>=', Timestamp.fromDate(startOfDay)),
      where('start_date', '<=', Timestamp.fromDate(endOfDay))
    ));
  
    const reservedRoomIds = reservationsSnap.docs.map(doc => doc.data()['room_id'].id);
  
    return allRooms.filter(room => !reservedRoomIds.includes(room.ref.id));
  }
  
  async getReservedDatesForRoom(roomRef: DocumentReference): Promise<string[]> {
    const reservationsSnap = await getDocs(query(
      collection(this.firestore, 'reservations'),
      where('room_id', '==', roomRef)
    ));
  
    const reservedDates: Set<string> = new Set();
    reservationsSnap.forEach(docSnap => {
      const data = docSnap.data();
      const date = data['start_date']?.toDate?.();
      if (date) {
        reservedDates.add(date.toISOString().split('T')[0]); // format yyyy-mm-dd
      }
    });
  
    return Array.from(reservedDates);
  }
  

  


}

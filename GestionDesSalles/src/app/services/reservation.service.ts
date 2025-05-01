import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, getDoc, getDocs } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { user } from 'rxfire/auth';
import { Observable, from, switchMap, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  constructor(private firestore: Firestore, private auth: Auth) { }

  getAllReservations(): Observable<any[]> {
    const reservationsRef = collection(this.firestore, 'reservations');

    return user(this.auth).pipe(
      switchMap(authUser => {
        if (!authUser) return from(Promise.resolve([]));
        const uidAdmin = authUser.uid;

        return collectionData(reservationsRef, { idField: 'uid' }).pipe(
          switchMap((reservations: any[]) => {
            const detailedReservations = reservations.map(async reservation => {
              try {
                const roomSnap = await getDoc(reservation.room_id);
                if (!roomSnap.exists()) return null;
                const roomData: any = roomSnap.data();

                if (roomData.created_by !== uidAdmin) return null;

                const userSnap = await getDoc(reservation.user_id);
                const userData = userSnap.exists() ? userSnap.data() : null;

                const equipmentList: any[] = [];
                const equipRef = collection(this.firestore, `reservations/${reservation.uid}/equipment`);
                const equipDocs = await getDocs(equipRef);
                for (const equip of equipDocs.docs) {
                  const equipData = equip.data();
                  const equipSnap = await getDoc(equipData['equipment_id']);
                  const equipInfo = equipSnap.exists() ? equipSnap.data() as { name: string } : null;
                  const equipName = equipInfo ? equipInfo.name : 'Inconnu';
                  equipmentList.push({ name: equipName });
                }


                return {
                  ...reservation,
                  room: roomData,
                  user: userData,
                  equipment: equipmentList,
                  startDate: reservation.start_date.toDate?.() ?? reservation.start_date,
                  endDate: reservation.end_date.toDate?.() ?? reservation.end_date
                };
              } catch (err) {
                console.error('Erreur de lecture:', err);
                return null;
              }
            });

            return from(Promise.all(detailedReservations)).pipe(
              map(all => all.filter(res => res !== null))
            );
          })
        );
      })
    );
  }
}

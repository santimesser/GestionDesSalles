import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  doc,
  addDoc,
  getDoc
} from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reservation-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservation-create.component.html',
  styleUrls: ['./reservation-create.component.css']
})
export class ReservationCreateComponent implements OnInit {
  salles: any[] = [];
  equipementsDisponibles: any[] = [];
  selectedEquipements: string[] = [];
  reservation: any = {
    room_id: null,
    start_date: '',
    end_date: '',
    disposition: ''
  };
  totalEstime: number = 0;

  constructor(
    private firestore: Firestore,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      const salleSnap = await getDocs(collection(this.firestore, 'rooms'));
      this.salles = salleSnap.docs.map(doc => ({ ref: doc.ref, data: doc.data() }));
    } catch (e) {
      console.error('Erreur chargement salles:', e);
    }
  }

  selectedRoomId: string = ''; 

  async onRoomChange() {
    this.selectedEquipements = [];
    this.totalEstime = 0;
  
    console.log("onRoomChange triggered");
  
    const roomObj = this.salles.find(s => s.ref.id === this.selectedRoomId);
    if (!roomObj) return;
  
    this.reservation.room_id = roomObj.ref;
  
    const salleData = roomObj.data;
    console.log("Salle sélectionnée:", salleData);
  
    const idsDisponibles: string[] = salleData?.equipment_ids || [];
    console.log("IDs équipements:", idsDisponibles);
  
    const equipSnap = await getDocs(collection(this.firestore, 'equipment'));
    const allEquip = equipSnap.docs.map(doc => ({ ref: doc.ref, data: doc.data() }));
  
    this.equipementsDisponibles = allEquip.filter(eq => idsDisponibles.includes(eq.ref.id));
    console.log("Équipements filtrés:", this.equipementsDisponibles);
  
    this.recalculerTotal();
  }
  toggleEquipement(refId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedEquipements.push(refId);
    } else {
      this.selectedEquipements = this.selectedEquipements.filter(id => id !== refId);
    }

    this.recalculerTotal();
  }

  recalculerTotal() {
    const prixBase = this.salles.find(s => s.ref.id === this.reservation.room_id?.id)?.data?.price_per_day || 0;

    const prixEquipements = this.equipementsDisponibles
      .filter(eq => this.selectedEquipements.includes(eq.ref.id))
      .reduce((total, eq) => total + (eq.data.extra_price || 0), 0);

    this.totalEstime = prixBase + prixEquipements;
  }

  async creerReservation() {
    try {
      const newReservationRef = await addDoc(collection(this.firestore, 'reservations'), {
        room_id: this.reservation.room_id,
        user_id: doc(this.firestore, `users/${localStorage.getItem('userUid')}`),
        start_date: Timestamp.fromDate(new Date(this.reservation.start_date)),
        end_date: Timestamp.fromDate(new Date(this.reservation.end_date)),
        disposition: this.reservation.disposition
      });

      for (const id of this.selectedEquipements) {
        const eqRef = doc(this.firestore, `equipment/${id}`);
        await addDoc(collection(this.firestore, `reservations/${newReservationRef.id}/equipment`), {
          equipment_id: eqRef
        });
      }

      this.snackBar.open('Réservation créée avec succès', 'Fermer', { duration: 3000 });
      this.router.navigate(['/client/reservations']);
    } catch (e) {
      console.error('Erreur lors de la réservation:', e);
      this.snackBar.open('Erreur lors de la réservation', 'Fermer', { duration: 3000 });
    }
  }
}

import { Component, OnInit, Inject } from '@angular/core';
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
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { Auth } from '@angular/fire/auth';

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
  reservationDate: string = '';
  selectedDate = new Date(this.reservationDate + 'T08:00:00');

  reservation: any = {
    room_id: null,
    start_date: '',
    end_date: '',
    disposition: ''
  };
  totalEstime: number = 0;
  selectedRoomId: string = '';
  sallePreSelectionnee: any = null;
  userId: string = '';
  schoolStart = new Date('2024-08-26');
  schoolEnd = new Date('2025-06-27');

  constructor(
    private firestore: Firestore,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: { salle: any }
  ) {
    if (data && data.salle) {
      this.sallePreSelectionnee = data.salle;
      this.selectedRoomId = data.salle.id;
      this.reservation.room_id = doc(this.firestore, `rooms/${data.salle.id}`);
      this.onRoomChange();
    }
  }

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      console.error('Utilisateur non connecté');
      return;
    }
    try {
      const salleSnap = await getDocs(collection(this.firestore, 'rooms'));
      this.salles = salleSnap.docs.map(doc => ({ ref: doc.ref, data: doc.data() }));
      if (this.sallePreSelectionnee) {
        this.onRoomChange();
      }
    } catch (e) {
      console.error('Erreur chargement salles:', e);
      this.snackBar.open('Erreur lors du chargement des salles', 'Fermer', { duration: 3000 });
    }
  }

  async onRoomChange() {
    this.selectedEquipements = [];
    this.equipementsDisponibles = [];
    this.totalEstime = 0;

    const roomObj = this.salles.find(s => s.ref.id === this.selectedRoomId);
    if (!roomObj) return;

    this.reservation.room_id = roomObj.ref;

    const salleData = roomObj.data;
    const idsDisponibles: string[] = salleData?.equipment_ids || [];

    try {
      const equipSnap = await getDocs(collection(this.firestore, 'equipment'));
      const allEquip = equipSnap.docs.map(doc => ({ ref: doc.ref, data: doc.data() }));
      this.equipementsDisponibles = allEquip.filter(eq => idsDisponibles.includes(eq.ref.id));
      this.recalculerTotal();
    } catch (e) {
      console.error('Erreur chargement équipements:', e);
      this.snackBar.open('Erreur lors du chargement des équipements', 'Fermer', { duration: 3000 });
    }
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
    const prixBase = this.salles.find(s => s.ref.id === this.selectedRoomId)?.data?.price_per_day || 0;
    const prixEquipements = this.equipementsDisponibles
      .filter(eq => this.selectedEquipements.includes(eq.ref.id))
      .reduce((total, eq) => total + (eq.data.extra_price || 0), 0);
    this.totalEstime = prixBase + prixEquipements;
  }

  async creerReservation() {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      console.error('Utilisateur non connecté');
      return;
    }
    if (!this.reservationDate) {
      this.snackBar.open('Veuillez choisir une date de réservation.', 'Fermer', { duration: 3000 });
      return;
    }

    const selectedDate = new Date(this.reservationDate + 'T08:00:00');

    if (selectedDate < this.schoolStart || selectedDate > this.schoolEnd) {
      this.snackBar.open('La date choisie est hors du calendrier scolaire.', 'Fermer', { duration: 3000 });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      this.snackBar.open('Vous ne pouvez pas réserver pour aujourd\'hui ou un jour passé.', 'Fermer', { duration: 3000 });
      return;
    }


    const userRef = doc(this.firestore, `users/${user.uid}`);

    const newReservation = {
      room_id: this.reservation.room_id,
      user_id: userRef,
      start_date: Timestamp.fromDate(selectedDate),
      end_date: Timestamp.fromDate(selectedDate),
      disposition: this.reservation.disposition,
      status: 'confirmed'
    };

    const resRef = await addDoc(collection(this.firestore, 'reservations'), newReservation);

    for (const id of this.selectedEquipements) {
      const eqRef = doc(this.firestore, `equipment/${id}`);
      await addDoc(collection(this.firestore, `reservations/${resRef.id}/equipment`), {
        equipment_id: eqRef
      });
    }

    this.snackBar.open('Réservation créée avec succès', 'Fermer', { duration: 3000 });
    this.router.navigate(['/client/reservations']);
  }

}
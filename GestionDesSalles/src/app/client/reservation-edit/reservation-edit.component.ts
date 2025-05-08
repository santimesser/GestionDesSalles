import { Component, Inject, OnInit } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  addDoc
} from '@angular/fire/firestore';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Timestamp } from 'firebase/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reservation-edit',
  imports: [FormsModule, CommonModule],
  templateUrl: './reservation-edit.component.html',
  styleUrl: './reservation-edit.component.css'
})
export class ReservationEditComponent implements OnInit {
  reservationId!: string;
  reservation: any = {};
  selectedDate: string = '';
  peutModifier: boolean = true;

  salleCourante: any = null;
  equipementsDisponibles: any[] = [];
  selectedEquipements: string[] = [];
  totalEstime: number = 0;
  schoolStart = new Date('2024-08-26');
  schoolEnd = new Date('2025-06-27'); 
  nouvelleDate = new Date(this.selectedDate + 'T08:00:00');

  constructor(
    private firestore: Firestore,
    private dialogRef: MatDialogRef<ReservationEditComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { reservationId: string }
  ) {
    this.reservationId = data.reservationId;
  }

  async ngOnInit() {
    try {
      // Charger la réservation
      const resRef = doc(this.firestore, `reservations/${this.reservationId}`);
      const resSnap = await getDoc(resRef);
      if (!resSnap.exists()) throw new Error('Réservation introuvable');

      const resData = resSnap.data();
      this.reservation = resData;

      const startDate = resData['start_date'].toDate();
      this.selectedDate = startDate.toISOString().slice(0, 10);

      const diffJours = (startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      this.peutModifier = diffJours > 14;

      // Charger la salle réservée
      const salleSnap = await getDoc(resData['room_id']);
      if (salleSnap.exists()) {
        this.salleCourante = { ref: resData['room_id'], data: salleSnap.data() };
      }

      // Charger les équipements loués actuellement
      const eqSnap = await getDocs(collection(this.firestore, `reservations/${this.reservationId}/equipment`));
      this.selectedEquipements = eqSnap.docs.map(d => d.data()['equipment_id'].id);

      // Charger tous les équipements
      const allEquipSnap = await getDocs(collection(this.firestore, 'equipment'));
      const allEquip = allEquipSnap.docs.map(doc => ({ ref: doc.ref, data: doc.data() }));

      // Filtrer ceux disponibles pour la salle actuelle
      const idsDisponibles: string[] = this.salleCourante?.data?.equipment_ids || [];
      this.equipementsDisponibles = allEquip.filter(eq => idsDisponibles.includes(eq.ref.id));

      // Recalculer total initial
      this.recalculerTotal();
    } catch (e) {
      console.error('Erreur chargement reservation:', e);
      this.snackBar.open('Erreur lors du chargement', 'Fermer', { duration: 3000 });
      this.dialogRef.close();
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
    const prixBase = this.salleCourante?.data?.price_per_day || 0;

    const prixEquipements = this.equipementsDisponibles
      .filter(eq => this.selectedEquipements.includes(eq.ref.id))
      .reduce((total, eq) => total + (eq.data.extra_price || 0), 0);

    this.totalEstime = prixBase + prixEquipements;
  }

  async modifierReservation() {

    if (this.nouvelleDate < this.schoolStart || this.nouvelleDate > this.schoolEnd) {
      this.snackBar.open('La date choisie est hors du calendrier scolaire.', 'Fermer', { duration: 3000 });
      return;
    }
    
  const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.nouvelleDate <= today) {
      this.snackBar.open('Vous ne pouvez pas réserver pour aujourd\'hui ou un jour passé.', 'Fermer', { duration: 3000 });
      return;
    }

    try {
      const ref = doc(this.firestore, `reservations/${this.reservationId}`);
      const nouvelleDate = new Date(this.selectedDate + 'T08:00:00');

      await updateDoc(ref, {
        start_date: Timestamp.fromDate(nouvelleDate),
        end_date: Timestamp.fromDate(nouvelleDate),
        disposition: this.reservation.disposition
      });

      // Supprimer anciens équipements
      const equipPath = collection(this.firestore, `reservations/${this.reservationId}/equipment`);
      const anciens = await getDocs(equipPath);
      for (const docu of anciens.docs) {
        await deleteDoc(docu.ref);
      }

      // Ajouter les nouveaux équipements
      for (const id of this.selectedEquipements) {
        const eqRef = doc(this.firestore, `equipment/${id}`);
        await addDoc(equipPath, {
          equipment_id: eqRef
        });
      }

      this.snackBar.open('Réservation modifiée avec succès', 'Fermer', { duration: 3000 });
      this.dialogRef.close();
    } catch (e) {
      console.error('Erreur modification:', e);
      this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
    }
  }
}

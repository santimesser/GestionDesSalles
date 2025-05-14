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

  /* ********************* Variables *********************** */

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

  /* ********************* constructeur *********************** */

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

    /* ********************* fonctions *********************** */ 

  /**
   * Initialise le composant.
   * Charge les salles de la base de données.
   * Si une salle a été selectionnée avant l'ouverture du dialogue, charge les équipements de cette salle.
   * Si une erreur est détectée, affiche un message d'erreur.
   * @returns {void}
   */
   async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (!user) {// si l'utilisateur n'est pas connecté
      console.error('Utilisateur non connecté');
      return;
    }
    try {
      const salleSnap = await getDocs(collection(this.firestore, 'rooms'));
      this.salles = salleSnap.docs.map(doc => ({ ref: doc.ref, data: doc.data() }));
      if (this.sallePreSelectionnee) {// si une salle a été selectionnée avant l'ouverture du dialogue
        this.onRoomChange();
      }
    } catch (e) {
      console.error('Erreur chargement salles:', e);
      this.snackBar.open('Erreur lors du chargement des salles', 'Fermer', { duration: 3000 });
    }
  }

  /**
   * Fonction appelée lors de la modification de la salle selectionnée.
   * Supprime les équipements selectionnés, les équipements disponibles et le total estimé.
   * Met à jour le champ room_id de la reservation avec la salle selectionnée.
   * Charge les équipements de la salle selectionnée.
   * Met à jour le total estimé.
   * Si une erreur est détectée, affiche un message d'erreur.
   * @returns {void}
   */
  async onRoomChange() {
    this.selectedEquipements = [];
    this.equipementsDisponibles = [];
    this.totalEstime = 0;

    const roomObj = this.salles.find(s => s.ref.id === this.selectedRoomId);
    if (!roomObj) return;// si la salle selectionnée n'existe pas

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

  /**
   * Modifie le tableau des équipements selectionnés en fonction de l'état du checkbox.
   * @param refId L'ID de l'équipement qui a été modifié.
   * @param event L'évènement qui a été déclenché.
   * @returns void
   */
  toggleEquipement(refId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {// si le checkbox est cochure
      this.selectedEquipements.push(refId);
    } else {
      this.selectedEquipements = this.selectedEquipements.filter(id => id !== refId);
    }
    this.recalculerTotal();
  }

  /**
   * Met à jour le montant total estimé de la réservation
   * en fonction des équipements selectionnés.
   * @returns void
   */
  recalculerTotal() {
    const prixBase = this.salles.find(s => s.ref.id === this.selectedRoomId)?.data?.price_per_day || 0;
    const prixEquipements = this.equipementsDisponibles
      .filter(eq => this.selectedEquipements.includes(eq.ref.id))
      .reduce((total, eq) => total + (eq.data.extra_price || 0), 0);
    this.totalEstime = prixBase + prixEquipements;
  }

  /**
   * Crée une nouvelle réservation en base de données.
   * 
   * Vérifie d'abord si l'utilisateur est connecté,
   * et si la date de réservation est dans le calendrier scolaire,
   * et si elle n'est pas dans le passé.
   * 
   * Puis crée la réservation en base de données,
   * en ajoutant les équipements selectionnés.
   * 
   * @returns Une promesse qui se résout lorsque la création est terminée
   */
  async creerReservation() {
    const user = await this.authService.getCurrentUser();
    if (!user) {// si l'utilisateur n'est pas connecté
      console.error('Utilisateur non connecté');
      return;
    }
    if (!this.reservationDate) {// si la date de reservation n'est pas choisie
      this.snackBar.open('Veuillez choisir une date de réservation.', 'Fermer', { duration: 3000 });
      return;
    }

    const selectedDate = new Date(this.reservationDate + 'T08:00:00');

    if (selectedDate < this.schoolStart || selectedDate > this.schoolEnd) {// si la date de reservation n'est pas dans le calendrier scolaire
      this.snackBar.open('La date choisie est hors du calendrier scolaire.', 'Fermer', { duration: 3000 });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {// si la date de reservation est dans le passe
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

    for (const id of this.selectedEquipements) {// ajouter les nouveaux équipements
      const eqRef = doc(this.firestore, `equipment/${id}`);
      await addDoc(collection(this.firestore, `reservations/${resRef.id}/equipment`), {
        equipment_id: eqRef
      });
    }

    this.snackBar.open('Réservation créée avec succès', 'Fermer', { duration: 3000 });
    this.router.navigate(['/client/reservations']);
  }

}
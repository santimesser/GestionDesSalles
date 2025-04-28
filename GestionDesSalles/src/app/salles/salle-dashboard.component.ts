import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { SalleService } from '../services/salle.service';
import { Salle } from '../models/sales.models';
import { Observable } from 'rxjs';
import { SalleCreateComponent } from './salle-create/salle-create.component';
import { SalleEditComponent } from './salle-edit/salle-edit.component';

@Component({
  selector: 'app-salle-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './salle-dashboard.component.html',
  styleUrls: ['./salle-dashboard.component.css']
})
export class SalleDashboardComponent implements OnInit {

  // Initialisation différée garantie via ngOnInit
  salles$!: Observable<Salle[]>;

  constructor(
    private dialog: MatDialog,
    private salleService: SalleService
  ) {}

  ngOnInit(): void {
    this.salles$ = this.salleService.listerSalles();
  }

    /**
   * Ouvre le dialogue d'édition pour une salle spécifique.
   */
    ouvrirFormulaireModifier(salleId: string): void {
      this.dialog.open(SalleEditComponent, {
        width: '400px',
        data: { salleId: salleId } // Passer l'ID au dialogue
      });
    }

    ouvrirFormulaireCreation(): void {
      this.dialog.open(SalleCreateComponent, {
        width: '400px'
      });
    }

    supprimerSalle(salleId: string): void {
      if (confirm('Voulez-vous vraiment supprimer cette salle ?')) {
        this.salleService.supprimerSalle(salleId).then(() => {
          console.log('Salle supprimée avec succès');
        });
      }
    }

}

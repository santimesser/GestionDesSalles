import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartType, ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ReservationService } from '../../services/reservation.service';
import { Firestore, getDoc, doc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../composants/header/header.component';

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule, HeaderComponent],
  templateUrl: './statistiques.component.html',
  styleUrls: ['./statistiques.component.css']
})
export class StatistiquesComponent implements OnInit {

  // Liste des mois en français avec leur valeur numérique (0-11)
  months = [
    { name: 'Janvier', value: 0 },
    { name: 'Février', value: 1 },
    { name: 'Mars', value: 2 },
    { name: 'Avril', value: 3 },
    { name: 'Mai', value: 4 },
    { name: 'Juin', value: 5 },
    { name: 'Juillet', value: 6 },
    { name: 'Août', value: 7 },
    { name: 'Septembre', value: 8 },
    { name: 'Octobre', value: 9 },
    { name: 'Novembre', value: 10 },
    { name: 'Décembre', value: 11 }
  ];

  selectedGraphics: boolean = true;

  selectedMonth = new Date().getMonth(); // Mois sélectionné par défaut : actuel
  selectedYear = new Date().getFullYear(); // Année actuelle

  pieChartType: ChartType = 'pie';

  // Données pour le graphique
  equipmentChartData: ChartData<'pie', number[], string> = {
    labels: [],
    datasets: [{ data: [] }]
  };

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    }
  };

  lineChartLabels: string[] = [];
  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      x: {},
      y: { beginAtZero: true }
    }
  };

  constructor(private reservationService: ReservationService, private firestore: Firestore) { }

  ngOnInit(): void {
    this.loadChartData();
    this.loadChartDataGraphique();
  }

  // Fonction pour charger les données du graphique selon le mois/année sélectionnés
  loadChartData(): void {
    this.reservationService.getEquipmentStatsByMonthYear(this.selectedMonth, this.selectedYear).subscribe(async (stats) => {
      const labels: string[] = [];
      const values: number[] = [];

      for (const [equipId, count] of Object.entries(stats)) {
        const docSnap = await getDoc(doc(this.firestore, `equipment/${equipId}`));
        const name = docSnap.exists() ? docSnap.data()['name'] : 'Inconnu';
        labels.push(name);
        values.push(count);
      }

      this.equipmentChartData = {
        labels,
        datasets: [{ data: values }]
      };
    });
  }

  loadChartDataGraphique():void{
    this.reservationService.getReservationsCountPerDayByRoom().subscribe(data => {
      console.log('→ Données reçues dans le composant:', data);
    
      const allDates = new Set<string>();
    
      for (const room in data) {
        for (const date in data[room]) {
          allDates.add(date);
        }
      }
    
      const sortedDates = Array.from(allDates).sort();
      console.log('→ Dates triées:', sortedDates);
    
      this.lineChartLabels = sortedDates;
    
      const datasets = Object.keys(data).map(room => {
        const counts = sortedDates.map(date => data[room][date] || 0);
        console.log(`→ Salle "${room}" - Données:`, counts);
        return {
          label: room,
          data: counts
        };
      });
    
      this.lineChartData = {
        labels: sortedDates,
        datasets
      };
    
      console.log('→ Données prêtes pour le graphique:', this.lineChartData);
    });
  }

  toggleGraphics():void{
    this.selectedGraphics = !this.selectedGraphics;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartType, ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ReservationService } from '../../services/reservation.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './statistiques.component.html',
  styleUrls: ['./statistiques.component.css']
})
export class StatistiquesComponent implements OnInit {

pieChartLabels: string[] = [];
  pieChartData: number[] = [];
  pieChartType: ChartType = 'pie';

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    }
  };

  constructor(private reservationService: ReservationService) {}

  ngOnInit(): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    this.reservationService.getAllReservations().pipe(
      map(reservations => {
        const filtered = reservations.filter(r => {
          const d = r.startDate instanceof Date ? r.startDate : new Date(r.startDate);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const equipmentCounts: { [key: string]: number } = {};

        for (const res of filtered) {
          for (const eq of res.equipment || []) {
            const name = eq.name || '(inconnu)';
            equipmentCounts[name] = (equipmentCounts[name] || 0) + 1;
          }
        }

        const labels = Object.keys(equipmentCounts);
        const data = labels.map(label => equipmentCounts[label]);

        this.pieChartLabels = labels;
        this.pieChartData = data;
      })
    ).subscribe();
  }
}

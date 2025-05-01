import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartType, ChartOptions } from 'chart.js';
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
  topSallesLabels: string[] = [];
  topSallesData: number[] = [];

  chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    }
  };

  constructor(private reservationService: ReservationService) {}

  ngOnInit(): void {
    this.reservationService.getAllReservations().pipe(
      map(reservations => {
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

        const filtered = reservations.filter(r => {
          const d = r.startDate instanceof Date ? r.startDate : new Date(r.startDate);
          return d >= threeMonthsAgo;
        });

        const salleCount: { [key: string]: number } = {};
        for (const r of filtered) {
          const name = r.room?.name || 'Inconnue';
          salleCount[name] = (salleCount[name] || 0) + 1;
        }

        const sorted = Object.entries(salleCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        this.topSallesLabels = sorted.map(e => e[0]);
        this.topSallesData = sorted.map(e => e[1]);
      })
    ).subscribe();
  }
}

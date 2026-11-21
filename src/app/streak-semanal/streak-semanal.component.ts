import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Semana } from '../models/usuario';
interface DiaStreak {
  label: string;
  concluido: boolean;
  hoje: boolean;
}
@Component({
  selector: 'app-streak-semanal',
  imports: [CommonModule],
  templateUrl: './streak-semanal.component.html',
  styleUrl: './streak-semanal.component.css'
})
export class StreakSemanalComponent implements OnChanges{
  @Input() streakAtual = 9;
  @Input() semana!: Semana;
     ngOnChanges() {
    if (!this.semana) return;

    const hoje = new Date().getDay(); 

    
  }
}

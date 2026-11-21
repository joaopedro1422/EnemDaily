import { Component } from '@angular/core';
import { RelatorioSemanalModalComponent } from '../relatorio-semanal-modal/relatorio-semanal-modal.component';
import { CommonModule } from '@angular/common';
import { compileOpaqueAsyncClassMetadata } from '@angular/compiler';
@Component({
  selector: 'app-relatorio-semanal-fab',
  imports: [RelatorioSemanalModalComponent, CommonModule],
  templateUrl: './relatorio-semanal-fab.component.html',
  styleUrl: './relatorio-semanal-fab.component.css'
})
export class RelatorioSemanalFabComponent {
   mostrarModal = false;

  abrirResumo() {
    this.mostrarModal = true;
  }

  fecharResumo() {
    this.mostrarModal = false;
  }
  isMonday(): boolean {
  const today = new Date();
  return today.getDay() === 4;
}
}

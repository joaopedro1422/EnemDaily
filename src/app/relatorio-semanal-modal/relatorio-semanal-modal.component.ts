import { AvatarComponent } from '../shared/avatar/avatar.component';
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthServiceService } from '../services/auth-service.service';
import { Usuario } from '../models/usuario';
@Component({
  selector: 'app-relatorio-semanal-modal',
  imports: [AvatarComponent, CommonModule],
  templateUrl: './relatorio-semanal-modal.component.html',
  styleUrl: './relatorio-semanal-modal.component.css'
})
export class RelatorioSemanalModalComponent {

  @Output() close = new EventEmitter<void>();
  humanas = 0;
  linguagens = 0;
  naturezas = 0;
  exatas = 0;
  usuarioLogado!: Usuario | null
  ngAfterViewInit() {
  this.animateValue(this.resumo.areas.humanas, 900, v => this.humanas = v);
  this.animateValue(this.resumo.areas.linguagens, 1000, v => this.linguagens = v);
  this.animateValue(this.resumo.areas.naturezas, 1100, v => this.naturezas = v);
  this.animateValue(this.resumo.areas.exatas, 1200, v => this.exatas = v);
}
constructor(private authService: AuthServiceService){}
  resumo = {
    acertosSemana: 78,
    xpSemana: 420,
    acertosTotais: 16,
    questoesRespondidas: 22,
    diasConsecutivos: 6,
    acertosConsecutivos: 11,
    areas: {
      humanas: 82,
      linguagens: 75,
      naturezas: 70,
      exatas: 65
    }
  };

  ngOnInit(){
      this.authService.usuario$.subscribe( async (usuario) =>{
      if(!usuario) return;
      this.usuarioLogado = usuario;
      
    })
  }
    getCircle(value: number, color: string): string {
    return `conic-gradient(
      ${color} ${value * 3.6}deg,
      rgba(255,255,255,0.2) 0deg
    )`;
  }
  animateValue(
  target: number,
  duration = 900,
  callback: (value: number) => void
) {
  const start = performance.now();

  const animate = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);

    const eased = 1 - Math.pow(1 - progress, 3);

    callback(Math.round(eased * target));

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
}

  fechar() {
    this.close.emit();
  }

}

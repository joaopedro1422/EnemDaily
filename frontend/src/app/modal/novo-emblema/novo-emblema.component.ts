import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import confetti from 'canvas-confetti';
import { Emblema } from '../../models/usuario';
import { IconeComponent } from '../../shared/icone/icone.component';

@Component({
  selector: 'app-novo-emblema',
  imports: [IconeComponent],
  templateUrl: './novo-emblema.component.html',
  styleUrl: './novo-emblema.component.css'
})
export class NovoEmblemaComponent implements OnInit, OnDestroy {
  @Input({ required: true }) emblemas: Emblema[] = [];
  @Output() fechar = new EventEmitter<void>();

  atual = 0;
  ciclo = 0;
  fechando = false;
  private timers: any[] = [];

  get emblema(): Emblema | undefined {
    return this.emblemas[this.atual];
  }

  get ultimo(): boolean {
    return this.atual >= this.emblemas.length - 1;
  }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.revelar();
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
    this.timers.forEach(clearTimeout);
  }

  private revelar() {
    this.ciclo++;
    const som = new Audio('emblema.mp3');
    som.volume = .8;
    som.play().catch(() => {});
    this.timers.push(setTimeout(() => this.festejar(), 1450));
  }

  private festejar() {
    const base = { colors: ['#F7D56A', '#FFFFFF', '#FFE9A8', '#6E7BFF'], disableForReducedMotion: true, zIndex: 1300, ticks: 200, scalar: .85 };
    confetti({ ...base, particleCount: 70, spread: 70, startVelocity: 34, origin: { x: .5, y: .45 } });
    this.timers.push(setTimeout(() => {
      confetti({ ...base, particleCount: 30, angle: 60, spread: 55, origin: { x: .08, y: .75 } });
      confetti({ ...base, particleCount: 30, angle: 120, spread: 55, origin: { x: .92, y: .75 } });
    }, 220));
  }

  @HostListener('document:keydown.escape')
  continuar() {
    if (this.fechando) return;
    if (!this.ultimo) {
      this.atual++;
      this.revelar();
      return;
    }
    this.fechando = true;
    this.timers.push(setTimeout(() => this.fechar.emit(), 320));
  }
}

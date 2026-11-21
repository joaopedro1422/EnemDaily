import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const CHAVE = 'ed-sons';
const VOLUME = 0.32;
const ESCALA = [523.25, 659.25, 783.99, 1046.5];

@Injectable({ providedIn: 'root' })
export class SomService {
  private ctx: AudioContext | null = null;
  private mestre: GainNode | null = null;
  private ruido: AudioBuffer | null = null;
  private readonly estado = new BehaviorSubject<boolean>(this.lerPreferencia());
  readonly ligado$ = this.estado.asObservable();

  get ligado(): boolean { return this.estado.value; }

  alternar(ligado = !this.ligado) {
    this.estado.next(ligado);
    try { localStorage.setItem(CHAVE, ligado ? '1' : '0'); } catch { /* sem armazenamento */ }
  }

  /** Para sons em arquivo (tambores, XP): só toca com os sons ligados. */
  tocarAudio(audio: HTMLAudioElement, inicio = 0) {
    if (!this.ligado) return;
    try {
      audio.currentTime = inicio;
      audio.play().catch(() => {});
    } catch { /* navegador sem suporte */ }
  }

  /** Risco curto de caneta marcando a bolha. */
  caneta() {
    this.tocar((c, t, saida) => {
      for (let i = 0; i < 3; i++) {
        const ini = t + i * 0.055;
        const f = c.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.setValueAtTime(2600 + i * 500, ini);
        f.Q.value = 1.4;
        this.rajada(c, ini, 0.05, 0.55 - i * 0.12, f, saida);
      }
    });
  }

  /** Encaixe de uma peça nova no campus. */
  pop() {
    this.tocar((c, t, saida) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(330, t);
      o.frequency.exponentialRampToValueAtTime(880, t + 0.09);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.9, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g).connect(saida);
      o.start(t); o.stop(t + 0.18);
    });
  }

  /** Terreno novo liberado: acorde curto e brilhante. */
  terreno() {
    this.tocar((c, t, saida) => {
      [659.25, 830.61, 987.77, 1318.5].forEach((hz, i) => this.nota(c, t + i * 0.07, hz, 0.55, 0.35, 'triangle', saida));
    });
  }

  /** Uma nota por bolinha do resumo do dia; acerto brilha, erro sai abafado. */
  bolinha(indice: number, acertou: boolean) {
    this.tocar((c, t, saida) => {
      const hz = ESCALA[Math.max(0, Math.min(indice, ESCALA.length - 1))];
      if (acertou) {
        this.nota(c, t, hz, 0.42, 0.45, 'triangle', saida);
        this.nota(c, t, hz * 2, 0.3, 0.08, 'sine', saida);
      } else {
        this.nota(c, t, hz / 2, 0.22, 0.28, 'sine', saida);
      }
    });
  }

  /** Bônus de sequência: chama subindo. */
  fogo() {
    this.tocar((c, t, saida) => {
      const f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 0.9;
      f.frequency.setValueAtTime(400, t);
      f.frequency.exponentialRampToValueAtTime(2400, t + 0.32);
      this.rajada(c, t, 0.42, 0.7, f, saida, 0.12);
    });
  }

  /** Convite de duelo: espadas se cruzando. */
  espadas() {
    this.tocar((c, t, saida) => {
      const f = c.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 3000;
      this.rajada(c, t, 0.07, 0.6, f, saida);
      [2793, 3951, 5274, 6645].forEach((hz, i) => this.nota(c, t + 0.01, hz, 0.55 - i * 0.1, 0.12 - i * 0.02, 'sine', saida));
      const f2 = c.createBiquadFilter();
      f2.type = 'highpass';
      f2.frequency.value = 2400;
      this.rajada(c, t + 0.16, 0.06, 0.45, f2, saida);
      [2349, 3322, 4699].forEach((hz, i) => this.nota(c, t + 0.17, hz, 0.45 - i * 0.1, 0.1 - i * 0.02, 'sine', saida));
    });
  }

  private tocar(desenhar: (c: AudioContext, t: number, saida: AudioNode) => void) {
    if (!this.ligado) return;
    const c = this.contexto();
    if (!c || !this.mestre) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    try { desenhar(c, c.currentTime + 0.01, this.mestre); } catch { /* ignora falhas de áudio */ }
  }

  private contexto(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    this.mestre = this.ctx.createGain();
    this.mestre.gain.value = VOLUME;
    this.mestre.connect(this.ctx.destination);
    return this.ctx;
  }

  private nota(c: AudioContext, t: number, hz: number, duracao: number, volume: number, tipo: OscillatorType, saida: AudioNode) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(hz, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
    o.connect(g).connect(saida);
    o.start(t);
    o.stop(t + duracao + 0.02);
  }

  private rajada(c: AudioContext, t: number, duracao: number, volume: number, filtro: AudioNode, saida: AudioNode, ataque = 0.004) {
    if (!this.ruido) {
      const n = Math.floor(c.sampleRate * 0.6);
      this.ruido = c.createBuffer(1, n, c.sampleRate);
      const d = this.ruido.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = c.createBufferSource();
    s.buffer = this.ruido;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
    s.connect(filtro).connect(g).connect(saida);
    s.start(t, Math.random() * 0.3);
    s.stop(t + duracao + 0.02);
  }

  private lerPreferencia(): boolean {
    try { return localStorage.getItem(CHAVE) !== '0'; } catch { return true; }
  }
}

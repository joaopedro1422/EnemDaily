import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SwPush, SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, filter, firstValueFrom } from 'rxjs';
import { APIURL } from '../models/Environment';

export type EstadoInstalacao = 'instalado' | 'disponivel' | 'ios' | 'indisponivel';
export type EstadoLembrete = 'carregando' | 'ativo' | 'inativo' | 'negado' | 'precisa-instalar' | 'indisponivel';

const DISPENSADO = 'ed-instalar-dispensado';
const DIAS_DISPENSADO = 14;

/** Tudo do PWA num lugar só: convite de instalação, atualização de versão e lembrete diário por push. */
@Injectable({ providedIn: 'root' })
export class PwaService {
  private swUpdate = inject(SwUpdate);
  private swPush = inject(SwPush);
  private http = inject(HttpClient);
  private convite: any = (window as any).__edInstalar ?? null;
  private sincronizado = false;

  readonly instalacao$ = new BehaviorSubject<EstadoInstalacao>('indisponivel');
  readonly atualizacao$ = new BehaviorSubject<boolean>(false);
  readonly lembrete$ = new BehaviorSubject<EstadoLembrete>('carregando');

  constructor() {
    window.addEventListener('ed-instalavel', () => { this.convite = (window as any).__edInstalar; this.recalcular(); });
    window.addEventListener('appinstalled', () => { this.convite = null; this.recalcular('instalado'); });
    this.recalcular();

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY')).subscribe(() => this.atualizacao$.next(true));
      this.swUpdate.unrecoverable.subscribe(() => location.reload());
      setInterval(() => this.swUpdate.checkForUpdate().catch(() => {}), 30 * 60 * 1000);
    }
    this.verificarLembrete();
  }

  get standalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  }

  get ios(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  get dispensado(): boolean {
    try {
      const t = Number(localStorage.getItem(DISPENSADO) || 0);
      return !!t && Date.now() - t < DIAS_DISPENSADO * 86_400_000;
    } catch { return false; }
  }

  private recalcular(forcar?: EstadoInstalacao) {
    const estado: EstadoInstalacao = forcar ?? (this.standalone ? 'instalado' : this.convite ? 'disponivel' : this.ios ? 'ios' : 'indisponivel');
    this.instalacao$.next(estado);
  }

  async instalar(): Promise<boolean> {
    if (!this.convite) return false;
    this.convite.prompt();
    const escolha = await this.convite.userChoice.catch(() => null);
    this.convite = null;
    (window as any).__edInstalar = null;
    const aceitou = escolha?.outcome === 'accepted';
    this.recalcular(aceitou ? 'instalado' : undefined);
    return aceitou;
  }

  dispensar() {
    try { localStorage.setItem(DISPENSADO, String(Date.now())); } catch { }
    this.recalcular();
  }

  atualizar() {
    this.swUpdate.activateUpdate().then(() => location.reload()).catch(() => location.reload());
  }

  // ------------------------------------------------------------------ lembrete diário

  private get headers() {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('tokenUser') ?? ''}` });
  }

  private suportaPush(): boolean {
    return this.swPush.isEnabled && 'PushManager' in window && 'Notification' in window;
  }

  /** Lê o estado do aparelho e, se já houver inscrição, garante que o backend conhece ela (troca de conta, reinstalação). */
  async verificarLembrete() {
    if (!this.suportaPush()) {
      this.lembrete$.next(this.ios && !this.standalone ? 'precisa-instalar' : 'indisponivel');
      return;
    }
    const sub = await firstValueFrom(this.swPush.subscription);
    if (sub) {
      this.lembrete$.next('ativo');
      if (!this.sincronizado && localStorage.getItem('tokenUser')) {
        this.sincronizado = true;
        this.http.post(`${APIURL}/push/inscricao`, { ...sub.toJSON(), aparelho: this.aparelho() }, { headers: this.headers }).subscribe({ error: () => {} });
      }
    } else {
      this.lembrete$.next(Notification.permission === 'denied' ? 'negado' : 'inativo');
    }
  }

  async ativarLembrete(): Promise<void> {
    if (!this.suportaPush()) { await this.verificarLembrete(); return; }
    this.lembrete$.next('carregando');
    try {
      const { chavePublica } = await firstValueFrom(this.http.get<{ chavePublica: string }>(`${APIURL}/push/chave`));
      const sub = await this.swPush.requestSubscription({ serverPublicKey: chavePublica });
      await firstValueFrom(this.http.post(`${APIURL}/push/inscricao`, { ...sub.toJSON(), aparelho: this.aparelho() }, { headers: this.headers }));
      this.sincronizado = true;
      this.lembrete$.next('ativo');
      this.http.post(`${APIURL}/push/teste`, {}, { headers: this.headers }).subscribe({ error: () => {} });
    } catch {
      this.lembrete$.next(Notification.permission === 'denied' ? 'negado' : 'inativo');
    }
  }

  async desativarLembrete(): Promise<void> {
    this.lembrete$.next('carregando');
    try {
      const sub = await firstValueFrom(this.swPush.subscription);
      if (sub) {
        await firstValueFrom(this.http.post(`${APIURL}/push/remover`, { endpoint: sub.endpoint })).catch(() => {});
        await this.swPush.unsubscribe().catch(() => sub.unsubscribe());
      }
    } finally {
      await this.verificarLembrete();
    }
  }

  /** Ao sair da conta, o aparelho para de receber lembretes daquela conta. */
  async desvincular(): Promise<void> {
    if (!this.suportaPush()) return;
    const sub = await firstValueFrom(this.swPush.subscription);
    if (sub) await firstValueFrom(this.http.post(`${APIURL}/push/remover`, { endpoint: sub.endpoint })).catch(() => {});
    this.sincronizado = false;
  }

  private aparelho(): string {
    const ua = navigator.userAgent;
    const so = /android/i.test(ua) ? 'Android' : this.ios ? 'iOS' : /windows/i.test(ua) ? 'Windows' : /mac/i.test(ua) ? 'macOS' : 'Outro';
    return `${so}${this.standalone ? ' · app' : ' · navegador'}`;
  }
}

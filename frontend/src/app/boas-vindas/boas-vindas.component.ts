import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { IconeComponent } from '../shared/icone/icone.component';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { CarregandoComponent } from '../shared/carregando/carregando.component';
import { AREAS } from '../shared/dia';
import { calcularProgresso, paletaDe, renderizarCampus, Progresso, TOTAL_POR_TRILHA } from '../shared/campus/campus';
import { EstadoLembrete, PwaService } from '../services/pwa.service';
import { contagemEnem } from '../shared/enem';

type Visual = 'areas' | 'campus' | 'voltar' | 'grupos' | 'lembrete';
interface Passo { visual: Visual; titulo?: string; }
interface LinhaRanking { nome: string; avatar: string; xp: number; xpDepois: number; de: number; para: number; eu?: boolean; }

@Component({
  selector: 'app-boas-vindas',
  imports: [IconeComponent, AvatarComponent, CarregandoComponent],
  templateUrl: './boas-vindas.component.html',
  styleUrl: './boas-vindas.component.css'
})
export class BoasVindasComponent implements OnInit, OnDestroy {
  @Input() nome = '';
  @Input() avatar = '';
  @Output() fechar = new EventEmitter<'comecar' | 'pular'>();

  private sanitizer = inject(DomSanitizer);
  private pwa = inject(PwaService);

  readonly areas = AREAS;
  readonly marcos = [
    { dias: 5, nome: 'Campinho', icone: 'target' },
    { dias: 50, nome: 'Trem', icone: 'clock' },
    { dias: 100, nome: 'Hospital', icone: 'shield' }
  ];
  readonly hojeExtenso = ((d: string) => d.charAt(0).toUpperCase() + d.slice(1))(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }));
  ranking: LinhaRanking[] = [];
  atual = 0;
  texto = '';
  falando = false;
  fechando = false;
  lembrete: EstadoLembrete = 'carregando';
  cenaCompleta: SafeHtml = '';
  cenaApagada: SafeHtml = '';
  cenaAcesa: SafeHtml = '';
  private adiouLembrete = false;
  private relogio: any;
  private timers: any[] = [];
  private sub?: Subscription;

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.pwa.segurarPedido(true);
    this.sub = this.pwa.lembrete$.subscribe(e => {
      const antes = this.lembrete;
      this.lembrete = e;
      if (this.atual >= this.passos.length) this.atual = this.passos.length - 1;
      if (this.passo.visual === 'lembrete' && antes !== e && e !== 'carregando') this.falar();
    });

    this.ranking = [
      { nome: 'Bia', avatar: 'ed1|humanas|orbita|nenhuma|||', xp: 1240, xpDepois: 1240, de: 0, para: 1 },
      { nome: 'Caio', avatar: 'ed1|matematica|diagonal|nenhuma|||', xp: 1180, xpDepois: 1180, de: 1, para: 2 },
      { nome: this.primeiroNome || 'Você', avatar: this.avatar, xp: 1105, xpDepois: 1285, de: 2, para: 0, eu: true },
      { nome: 'Duda', avatar: 'ed1|ameixa|pontos|nenhuma|||', xp: 990, xpDepois: 990, de: 3, para: 3 }
    ];

    const vb = (svg: string, c: number[]) => svg.replace(/viewBox="[^"]*"/, `viewBox="${c.join(' ')}"`);
    const seguro = (svg: string) => this.sanitizer.bypassSecurityTrustHtml(svg);
    const completo = renderizarCampus({ ...TOTAL_POR_TRILHA } as Progresso, paletaDe(false), {
      extras: { acertos: 3000, simulados: 50, redacoes: 50, maiorSequencia: 200, diasAtivos: 400, xp: 9000 }
    });
    this.cenaCompleta = seguro(vb(completo.svg, completo.terreno));

    const meio = calcularProgresso({ acertos: { linguagens: 30, humanas: 30, naturezas: 30, exatas: 30 }, diasAtivos: 100 });
    const extras = { acertos: 120, diasAtivos: 100, xp: 2600 };
    const apagada = renderizarCampus(meio, paletaDe(true), { extras, acesas: { linguagens: false, humanas: false, naturezas: false, exatas: false } });
    const acesa = renderizarCampus(meio, paletaDe(true), { extras, acesas: { linguagens: true, humanas: true, naturezas: true, exatas: false } });
    this.cenaApagada = seguro(vb(apagada.svg, apagada.terreno));
    this.cenaAcesa = seguro(vb(acesa.svg, acesa.terreno));

    this.falar();
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
    clearInterval(this.relogio);
    this.timers.forEach(clearTimeout);
    this.sub?.unsubscribe();
    if (!this.adiouLembrete) this.pwa.segurarPedido(false);
  }

  get primeiroNome(): string {
    return (this.nome || '').trim().split(/\s+/)[0];
  }

  /** O passo do lembrete só aparece quando o aparelho consegue receber notificações. */
  get passos(): Passo[] {
    const todos: Passo[] = [
      { visual: 'areas', titulo: 'Seja muito bem-vindo(a) ao enem.daily' },
      { visual: 'campus' },
      { visual: 'voltar' },
      { visual: 'grupos' },
      { visual: 'lembrete' }
    ];
    return this.lembrete === 'indisponivel' ? todos.slice(0, 4) : todos;
  }

  get passo(): Passo {
    return this.passos[this.atual];
  }

  get ultimo(): boolean {
    return this.atual === this.passos.length - 1;
  }

  get pedeLembrete(): boolean {
    return this.passo.visual === 'lembrete' && (this.lembrete === 'inativo' || this.lembrete === 'carregando');
  }

  get fala(): string {
    switch (this.passo.visual) {
      case 'areas':
        return `${this.primeiroNome ? this.primeiroNome + ', todo' : 'Todo'} dia chegam 4 questões novas e inéditas: uma de cada área do ENEM. Quanto mais rápido você acerta, mais XP você ganha.`;
      case 'campus':
        return `Cada acerto nas questões adiciona uma nova construção ao seu campus. Este é o projeto para ${contagemEnem()?.edicao.ano ?? new Date().getFullYear() + 1}, você deve construí-lo até novembro!`;
      case 'voltar':
        return 'Voltar todos os dias também constrói! Hospitais, áreas de lazer, metrô e diversas outras estruturas são construídas com a sua frequência por aqui.';
      case 'grupos':
        return 'Crie um grupo, convide seus amigos pelo link e disputem o ranking. Também dá para desafiar alguém para um duelo: no dia marcado, vence quem fizer mais XP.';
      case 'lembrete':
        switch (this.lembrete) {
          case 'ativo': return 'Lembretes ativados. Todo dia às 10h você recebe um aviso quando o desafio estiver no ar.';
          case 'negado': return 'As notificações estão bloqueadas neste navegador. Se mudar de ideia, dá para liberar nas configurações do aparelho.';
          case 'precisa-instalar': return 'No iPhone, os lembretes chegam com o enem.daily na tela de início: toque em Compartilhar e depois em "Adicionar à Tela de Início".';
          default: return 'Por último: quer um lembrete quando o desafio do dia estiver no ar? É uma notificação por dia, às 10h, para você não perder a sequência.';
        }
    }
  }

  private falar() {
    clearInterval(this.relogio);
    const alvo = this.fala;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { this.texto = alvo; this.falando = false; return; }
    this.texto = '';
    this.falando = true;
    let i = 0;
    this.relogio = setInterval(() => {
      i += 2;
      this.texto = alvo.slice(0, i);
      if (i >= alvo.length) {
        clearInterval(this.relogio);
        this.falando = false;
      }
    }, 28);
  }

  @HostListener('document:keydown.enter', ['$event'])
  teclaEnter(e: KeyboardEvent) {
    if ((e.target as HTMLElement | null)?.closest?.('button')) return;
    this.avancar();
  }

  avancar() {
    if (this.falando) {
      clearInterval(this.relogio);
      this.texto = this.fala;
      this.falando = false;
      return;
    }
    if (this.pedeLembrete) return void this.ativarLembrete();
    if (this.ultimo) return this.sair('comecar');
    this.atual++;
    this.falar();
  }

  voltar() {
    if (this.atual === 0) return;
    this.atual--;
    this.falar();
  }

  async ativarLembrete() {
    if (this.lembrete === 'carregando') return;
    await this.pwa.ativarLembrete();
  }

  agoraNao() {
    this.adiouLembrete = true;
    this.sair('comecar');
  }

  @HostListener('document:keydown.escape')
  pular() {
    this.sair('pular');
  }

  private sair(motivo: 'comecar' | 'pular') {
    if (this.fechando) return;
    this.fechando = true;
    clearInterval(this.relogio);
    this.falando = false;
    this.timers.push(setTimeout(() => this.fechar.emit(motivo), 320));
  }
}

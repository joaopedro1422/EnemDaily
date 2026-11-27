import { AvatarComponent } from '../shared/avatar/avatar.component';
import { ChangeDetectorRef, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AtividadeRecente, Grupo, UsuarioGrupo } from '../models/grupo';
import { Usuario } from '../models/usuario';
import { RankingDeltaEvent } from '../models/dtos';
import { APIURL } from '../models/Environment';
import { GrupoService } from '../services/grupo.service';
import { AuthServiceService } from '../services/auth-service.service';
import { AuthModalComponent } from '../modal/auth-modal/auth-modal.component';
import { PodioMensalComponent } from '../modal/podio-mensal/podio-mensal.component';
import { GrupoConfigComponent } from '../modal/grupo-config/grupo-config.component';
import { Alert } from '../alerts';
import { CarregandoComponent } from '../shared/carregando/carregando.component';
import { IconeComponent } from '../shared/icone/icone.component';
import { AREAS, InfoArea, formatarNumero } from '../shared/dia';
import { progressoDeColega, totalDePecas } from '../shared/campus/campus';

type Aba = 'geral' | 'mensal' | 'streaks';

export interface Destaque {
  chave: string;
  rotulo: string;
  icone: string;
  cor: string;
  nome: string;
  avatar: string;
  valor: string;
  unidade: string;
  frase: string;
}

const TEMPO_DESTAQUE = 6500;

@Component({
  selector: 'app-grupo',
  imports: [AvatarComponent, AuthModalComponent, PodioMensalComponent, GrupoConfigComponent, IconeComponent, CarregandoComponent],
  templateUrl: './grupo.component.html',
  styleUrl: './grupo.component.css'
})
export class GrupoComponent implements OnInit, OnDestroy {
  idGrupo = '';
  grupo: Grupo | null = null;
  carregando = true;
  usuario: Usuario | null = null;
  usuarioAdmin = false;
  usuarioPresente = false;
  isConvite = false;
  mostrarConvite = false;
  entrando = false;
  msgErro = '';
  saindoConvite = false;

  aba: Aba = 'geral';
  readonly abas: { chave: Aba; nome: string; icone: string }[] = [
    { chave: 'geral', nome: 'Geral', icone: 'trophy' },
    { chave: 'mensal', nome: 'Mensal', icone: 'medal' },
    { chave: 'streaks', nome: 'Sequência', icone: 'flame' }
  ];
  ranking: UsuarioGrupo[] = [];
  qntMembros = 0;
  mediaXp = 0;
  ganhou: Record<string, number> = {};
  subiu: Record<string, boolean> = {};
  exibido: Record<string, number> = {};

  destaques: Destaque[] = [];
  atual = 0;
  pausado = false;
  cicloDestaque = 0;

  atividades: AtividadeRecente[] = [];
  verTodasAtividades = false;

  copiado = false;
  exibirPodio = false;
  exibirBannerPodio = false;
  bannerRecolhido = false;
  exibirConfig = false;
  mostrarLogin = false;
  abrirPerfil(u: UsuarioGrupo) { this.router.navigate(['/u', u.usuario]); }
  confirmandoSaida = false;

  readonly formatarNumero = formatarNumero;
  private es?: EventSource;
  private ultimoSeq = 0;
  private subs = new Subscription();
  private timers: any[] = [];
  private relogioDestaque: any;
  private toqueX: number | null = null;
  private musica = new Audio('som-grupo.mp3');
  private audioLiberado = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private grupoService: GrupoService,
    private authService: AuthServiceService,
    private host: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.idGrupo = this.route.snapshot.paramMap.get('id')!;
    this.isConvite = this.route.snapshot.queryParamMap.has('convite');
    this.mostrarConvite = this.isConvite;
    this.grupoService.getGrupo(this.idGrupo).subscribe({
      next: res => this.carregar(res),
      error: err => {
        this.carregando = false;
        if (err.status === 401) this.authService.logout();
      }
    });
  }

  ngOnDestroy() {
    this.es?.close();
    this.subs.unsubscribe();
    this.timers.forEach(clearTimeout);
    clearInterval(this.relogioDestaque);
  }

  private depois(fn: () => void, ms: number) {
    this.timers.push(setTimeout(fn, ms));
  }

  private carregar(res: Grupo) {
    this.grupo = res;
    this.idGrupo = res.id;
    this.qntMembros = res.usuariogrupo.length;
    this.mediaXp = Math.round(res.usuariogrupo.reduce((s, u) => s + (u.xpGrupo || 0), 0) / (this.qntMembros || 1));
    this.atividades = [...(res.atividadesRecentes ?? [])];
    this.ordenarAtividades();

    const diasDeGrupo = (Date.now() - new Date(res.dtCriacao).getTime()) / 86400000;
    this.montarDestaques(diasDeGrupo);

    this.subs.add(this.authService.usuario$.subscribe(u => {
      this.usuario = u;
      if (!u) {
        if (!this.isConvite) this.router.navigate(['/Home']);
        return;
      }
      this.usuarioAdmin = res.idAdmin === u.id;
      this.usuarioPresente = res.usuariogrupo.some(x => x.usuario === u.usuario);
      if (!this.usuarioPresente) this.mostrarConvite = true;
      if (!res.admVisivel) res.usuariogrupo = res.usuariogrupo.filter(x => !x.isAdm);
      this.ordenar();
    }));
    this.ordenar();

    const dia = new Date().getDate();
    if (!this.isConvite && diasDeGrupo > 5) {
      if (dia === 1) this.depois(() => (this.exibirPodio = true), 2500);
      if (dia <= 3) {
        this.exibirBannerPodio = true;
        this.depois(() => (this.bannerRecolhido = true), 3500);
      }
    }

    this.abrirStream();
    this.iniciarDestaques();
    this.carregando = false;
  }

  valor(u: UsuarioGrupo, aba: Aba = this.aba): number {
    return aba === 'geral' ? u.xpGrupo ?? 0 : aba === 'mensal' ? u.xpMensal ?? 0 : u.sequenciaAtual ?? 0;
  }

  valorExibido(u: UsuarioGrupo): number {
    return this.exibido[u.usuario] ?? this.valor(u);
  }

  get unidade(): string {
    return this.aba === 'streaks' ? 'dias' : 'XP';
  }

  ehEu(u: UsuarioGrupo): boolean {
    return u.usuario === this.usuario?.usuario;
  }

  inicial(nome: string): string {
    return (nome ?? '?').trim().charAt(0).toUpperCase();
  }

  trocarAba(a: Aba) {
    if (a === this.aba) return;
    this.flip(() => {
      this.aba = a;
      this.ordenar();
    });
  }

  private ordenar() {
    if (!this.grupo) return;
    const base = this.grupo.usuariogrupo;
    const aba = this.aba;
    this.ranking = [...base].sort((a, b) => this.valor(b, aba) - this.valor(a, aba) || (b.xpGrupo ?? 0) - (a.xpGrupo ?? 0));
  }

  private flip(mudar: () => void) {
    const raiz = this.host.nativeElement;
    const antes = new Map<string, DOMRect>();
    raiz.querySelectorAll<HTMLElement>('[data-id]').forEach(el => antes.set(el.dataset['id']!, el.getBoundingClientRect()));
    mudar();
    this.cdr.detectChanges();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    raiz.querySelectorAll<HTMLElement>('[data-id]').forEach(el => {
      const r0 = antes.get(el.dataset['id']!);
      if (!r0) {
        el.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
        return;
      }
      const r1 = el.getBoundingClientRect();
      const dx = r0.left - r1.left;
      const dy = r0.top - r1.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      const sobe = dy > 0;
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)`, zIndex: sobe ? 3 : 1 },
          { transform: `translate(${dx * .15}px, ${dy * .15}px) scale(${sobe ? 1.025 : 1})`, zIndex: sobe ? 3 : 1, offset: .7 },
          { transform: 'none', zIndex: sobe ? 3 : 1 }
        ],
        { duration: 720, easing: 'cubic-bezier(.22, .9, .25, 1)' }
      );
    });
  }

  private abrirStream() {
    this.es = new EventSource(`${APIURL}/gruposStream/${this.idGrupo}/stream`);
    this.es.addEventListener('ranking-delta', (event: MessageEvent) => {
      const evt = JSON.parse(event.data) as RankingDeltaEvent;
      if (evt.grupoId !== this.idGrupo || evt.seq <= this.ultimoSeq) return;
      this.ultimoSeq = evt.seq;
      this.zone.run(() => this.aplicarDelta(evt.usuario, evt.xpGanho));
    });
  }

  aplicarDelta(nome: string, xp: number) {
    const u = this.grupo?.usuariogrupo.find(x => x.usuario === nome);
    if (!u) return;
    const posAntes = this.ranking.indexOf(u);
    const valorAntes = this.valor(u);
    this.flip(() => {
      u.xpGrupo = (u.xpGrupo ?? 0) + xp;
      u.xpMensal = (u.xpMensal ?? 0) + xp;
      u.xpHoje = (u.xpHoje ?? 0) + xp;
      u.xpSemanal = (u.xpSemanal ?? 0) + xp;
      this.exibido[nome] = valorAntes;
      this.ordenar();
      this.ganhou[nome] = xp;
      if (this.ranking.indexOf(u) < posAntes) this.subiu[nome] = true;
      this.atividades.unshift({ usuario: nome, dataHora: new Date().toISOString() });
    });
    this.contar(nome, valorAntes, this.valor(u));
    this.depois(() => {
      delete this.ganhou[nome];
      delete this.subiu[nome];
    }, 2600);
  }

  private contar(nome: string, de: number, ate: number) {
    if (de === ate) {
      delete this.exibido[nome];
      return;
    }
    const inicio = performance.now();
    const dur = 900;
    const passo = (t: number) => {
      const k = Math.min(1, (t - inicio) / dur);
      this.exibido[nome] = Math.round(de + (ate - de) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(passo);
      else delete this.exibido[nome];
    };
    requestAnimationFrame(passo);
  }

  private ordenarAtividades() {
    this.atividades.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }

  get atividadesVisiveis(): AtividadeRecente[] {
    return this.verTodasAtividades ? this.atividades : this.atividades.slice(0, 5);
  }

  avatarDe(nome: string): string {
    return this.grupo?.usuariogrupo.find(u => u.usuario === nome)?.avatar ?? '';
  }

  tempoRelativo(data: string): string {
    const min = Math.floor(Math.max(0, Date.now() - new Date(data).getTime()) / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h} h`;
    const d = Math.floor(h / 24);
    return d === 1 ? 'ontem' : `há ${d} dias`;
  }

  private formataTempo(seg: number): string {
    const s = Math.round(seg);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  private montarDestaques(dias: number) {
    const membros = this.grupo?.usuariogrupo ?? [];
    const lista: Destaque[] = [];
    const totalXp = membros.reduce((s, u) => s + (u.xpGrupo || 0), 0);
    const melhor = (f: (u: UsuarioGrupo) => number) => [...membros].sort((a, b) => f(b) - f(a))[0];

    if (membros.length && totalXp > 80 && dias > 1) {
      const hoje = melhor(u => u.xpHoje ?? 0);
      if (hoje?.xpHoje > 0) lista.push({ chave: 'hoje', rotulo: 'Destaque do dia', icone: 'zap', cor: '#5B6CFF', nome: hoje.usuario, avatar: hoje.avatar, valor: formatarNumero(hoje.xpHoje), unidade: 'XP hoje', frase: 'Ninguém pontuou mais nas últimas horas.' });

      const acertos = melhor(u => u.sequenciaAcertos ?? 0);
      if (acertos?.sequenciaAcertos > 1) lista.push({ chave: 'acertos', rotulo: 'Sequência de acertos', icone: 'flame', cor: '#FF7A1A', nome: acertos.usuario, avatar: acertos.avatar, valor: String(acertos.sequenciaAcertos), unidade: 'acertos seguidos', frase: 'A maior sequência de acertos do grupo.' });

      const semana = melhor(u => u.xpSemanal ?? 0);
      if (semana?.xpSemanal > 0) lista.push({ chave: 'semana', rotulo: 'Melhor da semana', icone: 'crown', cor: '#E6B325', nome: semana.usuario, avatar: semana.avatar, valor: formatarNumero(semana.xpSemanal), unidade: 'XP na semana', frase: 'Quem mais somou pontos nesta semana.' });

      const constancia = melhor(u => u.sequenciaAtual ?? 0);
      if (constancia?.sequenciaAtual > 1) lista.push({ chave: 'dias', rotulo: 'Constância', icone: 'calendar-check', cor: '#2FBF7F', nome: constancia.usuario, avatar: constancia.avatar, valor: String(constancia.sequenciaAtual), unidade: 'dias seguidos', frase: 'Respondendo o desafio todo dia, sem falhar.' });

      const rapido = [...membros].filter(u => u.tempoMedio > 0).sort((a, b) => a.tempoMedio - b.tempoMedio)[0];
      if (rapido) lista.push({ chave: 'tempo', rotulo: 'Mais rápido', icone: 'timer', cor: '#22B3E6', nome: rapido.usuario, avatar: rapido.avatar, valor: this.formataTempo(rapido.tempoMedio), unidade: 'de tempo médio', frase: 'O menor tempo médio de resposta do grupo.' });

      const campus = membros.map(u => ({ u, p: totalDePecas(progressoDeColega(u)) })).sort((a, b) => b.p - a.p)[0];
      if (campus && campus.p > 1 && campus.u.acertosLinguagens !== undefined) lista.push({ chave: 'campus', rotulo: 'Maior campus', icone: 'school', cor: '#8C7BFF', nome: campus.u.usuario, avatar: campus.u.avatar, valor: String(campus.p), unidade: 'peças construídas', frase: 'O campus mais completo entre os membros.' });

      if (dias > 30) {
        const revelacao = membros
          .filter(u => (u.xpMensal ?? 0) >= 60 && (u.xpGrupo ?? 0) > 0)
          .map(u => ({ u, r: u.xpMensal / u.xpGrupo }))
          .filter(x => x.r >= .5)
          .sort((a, b) => b.r - a.r || b.u.xpMensal - a.u.xpMensal)[0];
        if (revelacao) lista.push({ chave: 'revelacao', rotulo: 'Revelação do mês', icone: 'trending-up', cor: '#FF5C8A', nome: revelacao.u.usuario, avatar: revelacao.u.avatar, valor: `${Math.min(100, Math.round(revelacao.r * 100))}%`, unidade: `do XP veio em ${this.mesAtual}`, frase: 'Quem mais cresceu no grupo neste mês.' });
      }

      const madrugador = [...membros].filter(u => u.primeiraRespostaHoje).sort((a, b) => a.primeiraRespostaHoje!.localeCompare(b.primeiraRespostaHoje!))[0];
      if (madrugador) {
        const [h, m] = madrugador.primeiraRespostaHoje!.split(':').map(Number);
        lista.push({ chave: 'madrugador', rotulo: h < 9 ? 'Madrugador' : 'Primeiro do dia', icone: 'clock', cor: '#F2994A', nome: madrugador.usuario, avatar: madrugador.avatar, valor: `${h}h${String(m).padStart(2, '0')}`, unidade: 'primeira resposta', frase: 'Foi quem abriu o desafio de hoje no grupo.' });
      }

      const campos: Record<string, keyof UsuarioGrupo> = { linguagens: 'acertosLinguagens', humanas: 'acertosHumanas', naturezas: 'acertosNaturezas', exatas: 'acertosExatas' };
      for (const area of AREAS) {
        if (this.grupo && !this.grupo[area.chave]) continue;
        const campo = campos[area.chave];
        const top = [...membros].sort((a, b) => ((b[campo] as number) ?? 0) - ((a[campo] as number) ?? 0))[0];
        const n = (top?.[campo] as number) ?? 0;
        if (n >= 3) lista.push({ chave: 'esp-' + area.chave, rotulo: `Especialista em ${area.nome}`, icone: area.icone, cor: area.cor, nome: top.usuario, avatar: top.avatar, valor: String(n), unidade: `acertos em ${area.nome}`, frase: 'Ninguém no grupo acertou mais questões dessa área.' });
      }
    }

    if (!lista.length) {
      lista.push({ chave: 'vazio', rotulo: 'Destaques', icone: 'sparkles', cor: '#5B6CFF', nome: '', avatar: '', valor: '', unidade: '', frase: 'Os destaques aparecem conforme o grupo responde: maior sequência, mais rápido, melhor do dia e mais.' });
    }
    this.destaques = lista;
  }

  private iniciarDestaques() {
    clearInterval(this.relogioDestaque);
    if (this.destaques.length < 2) return;
    this.relogioDestaque = setInterval(() => {
      if (!this.pausado) this.irPara(this.atual + 1, false);
    }, TEMPO_DESTAQUE);
  }

  irPara(i: number, manual = true) {
    const n = this.destaques.length;
    this.atual = ((i % n) + n) % n;
    this.cicloDestaque++;
    if (manual) this.iniciarDestaques();
  }

  toqueInicio(e: PointerEvent) {
    this.toqueX = e.clientX;
    this.pausado = true;
  }

  toqueFim(e: PointerEvent) {
    if (this.toqueX !== null) {
      const dx = e.clientX - this.toqueX;
      if (Math.abs(dx) > 40) this.irPara(this.atual + (dx < 0 ? 1 : -1));
    }
    this.toqueX = null;
    this.pausado = false;
  }

  @HostListener('document:visibilitychange')
  visibilidade() {
    this.pausado = document.hidden;
  }

  async copiarConvite() {
    const link = `${location.origin}/grupo/${this.idGrupo}?convite`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const t = document.createElement('textarea');
      t.value = link;
      t.style.position = 'fixed';
      t.style.left = '-9999px';
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    this.copiado = true;
    this.depois(() => (this.copiado = false), 1600);
  }

  compartilharWhatsApp() {
    const link = `${location.origin}/grupo/${this.idGrupo}?convite`;
    const msg = `Bora competir no desafio diário do ENEM? 🎓\n\nEntra no meu grupo no enem.daily: ${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  }

  async entrarNoGrupo() {
    if (!this.usuario) {
      this.mostrarLogin = true;
      return;
    }
    this.entrando = true;
    this.msgErro = '';
    try {
      this.musica.volume = 0;
      await this.musica.play();
      this.audioLiberado = true;
    } catch {}
    this.grupoService.addUsuarioGrupo(this.idGrupo).subscribe({
      next: res => {
        this.entrando = false;
        this.usuario?.grupos.push({ id: res.id, nome: res.nome, img: res.img, membros: res.usuariogrupo.length, publico: res.publico, naturezas: res.naturezas, humanas: res.humanas, linguagens: res.linguagens, exatas: res.exatas, posicao: res.usuariogrupo.length });
        if (this.usuario) this.authService.atualizarUsuario(this.usuario);
        this.grupo = res;
        this.qntMembros = res.usuariogrupo.length;
        this.usuarioPresente = true;
        this.ordenar();
        this.saindoConvite = true;
        this.depois(() => {
          this.mostrarConvite = false;
          this.saindoConvite = false;
          if (this.audioLiberado) {
            this.musica.currentTime = 0;
            this.musica.volume = 1;
            this.musica.play().catch(() => {});
          }
          Alert.toast(`Bem-vindo(a) ao ${res.nome}!`);
        }, 650);
      },
      error: () => {
        this.entrando = false;
        this.msgErro = 'Você já faz parte deste grupo.';
      }
    });
  }

  sairDoGrupo() {
    if (!this.usuario || !this.grupo) return;
    if (this.usuario.demo) {
      this.authService.open();
      return;
    }
    this.confirmandoSaida = true;
  }

  confirmarSaida() {
    if (!this.usuario || !this.grupo) return;
    this.confirmandoSaida = false;
    this.grupoService.removeUsuarioGrupo(this.grupo.id, String(this.usuario.id)).subscribe({
      next: res => {
        if (!this.usuario) return;
        this.usuario.grupos = res;
        this.authService.atualizarUsuario(this.usuario);
        this.router.navigate(['/homeGrupos']);
      }
    });
  }

  get areasDoGrupo(): InfoArea[] {
    return this.grupo ? AREAS.filter(a => this.grupo![a.chave]) : [];
  }

  get mesAtual(): string {
    return new Date().toLocaleString('pt-BR', { month: 'long' });
  }

  get mesPassado(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() - 1, 1).toLocaleString('pt-BR', { month: 'long' });
  }

  voltar() {
    this.router.navigate(['/homeGrupos']);
  }
}

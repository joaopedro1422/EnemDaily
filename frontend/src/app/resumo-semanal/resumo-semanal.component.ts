import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { take } from 'rxjs';
import { AuthServiceService } from '../services/auth-service.service';
import { LinhaResumoSemanal, UsuarioService } from '../services/usuario.service';
import { EstruturasPremiumService } from '../services/estruturas-premium.service';
import { Usuario } from '../models/usuario';
import { IconeComponent } from '../shared/icone/icone.component';
import { CarregandoComponent } from '../shared/carregando/carregando.component';
import { AREAS, COR_ERRO, ChaveArea, InfoArea, MODO_TESTE, formatarNumero } from '../shared/dia';
import { Progresso, calcularProgresso, paletaDe, progressoDoUsuario, renderizarCampus, totalDePecas } from '../shared/campus/campus';
import { baixarArquivo, compartilharArquivo, gerarPng } from '../shared/exportar/exportar-imagem';

interface DiaSemana {
  data: Date;
  letra: string;
  hoje: boolean;
  respondidas: number;
  acertos: number;
  xp: number;
  cores: (string | null)[];
}

const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const ORDEM_SIMBOLO: ChaveArea[] = ['linguagens', 'humanas', 'naturezas', 'exatas'];

@Component({
  selector: 'app-resumo-semanal',
  imports: [IconeComponent, CarregandoComponent],
  templateUrl: './resumo-semanal.component.html',
  styleUrl: './resumo-semanal.component.css'
})
export class ResumoSemanalComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly posicoes = [{ x: 32.5, y: 32.5 }, { x: 67.5, y: 32.5 }, { x: 32.5, y: 67.5 }, { x: 67.5, y: 67.5 }];
  readonly erro = COR_ERRO;

  xis(p: { x: number; y: number }): string {
    const d = 2.8;
    return `M${p.x - d} ${p.y - d}L${p.x + d} ${p.y + d}M${p.x + d} ${p.y - d}L${p.x - d} ${p.y + d}`;
  }

  @Output() fechar = new EventEmitter<void>();
  @ViewChild('arte') arteRef?: ElementRef<HTMLElement>;
  @ViewChild('moldura') molduraRef?: ElementRef<HTMLElement>;

  readonly formatarNumero = formatarNumero;
  carregando = true;
  fechando = false;
  usuario: Usuario | null = null;
  dias: DiaSemana[] = [];
  periodo = '';
  xp = 0;
  respondidas = 0;
  acertos = 0;
  taxa = 0;
  diasAtivos = 0;
  sequencia = 0;
  pecasNovas = 0;
  pecasMostradas = 0;
  totalPecas = 0;
  melhorArea: { info: InfoArea; pct: number; acertos: number } | null = null;
  timelapse: SafeHtml = '';
  campusArte: SafeHtml = '';
  ciclo = 0;
  escala = .3;
  gerando = false;
  aviso = '';
  noite = new Date().getHours() >= 18 || new Date().getHours() < 6;

  private antes: Progresso = progressoDoUsuario(null);
  private depois: Progresso = progressoDoUsuario(null);
  private timers: any[] = [];
  private observador?: ResizeObserver;
  private duracaoLapse = 0;

  constructor(private authService: AuthServiceService, private usuarioService: UsuarioService, private premium: EstruturasPremiumService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.authService.usuario$.pipe(take(1)).subscribe(u => {
      this.usuario = u;
      if (!u) return this.sair();
      if (u.demo) return this.aplicar(this.linhasDeExemplo());
      this.usuarioService.getResumoSemanal().subscribe({
        next: l => this.aplicar(l?.length || !MODO_TESTE ? l ?? [] : this.linhasDeExemplo()),
        error: () => this.aplicar(MODO_TESTE ? this.linhasDeExemplo() : [])
      });
    });
  }

  ngAfterViewInit() {
    this.ajustarEscala();
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
    this.timers.forEach(clearTimeout);
    this.observador?.disconnect();
  }

  private ajustarEscala() {
    const el = this.molduraRef?.nativeElement;
    if (!el) return;
    this.observador?.disconnect();
    this.observador = new ResizeObserver(() => (this.escala = el.clientWidth / 1080));
    this.observador.observe(el);
    this.escala = el.clientWidth / 1080 || .3;
  }

  private linhasDeExemplo(): LinhaResumoSemanal[] {
    const linhas: LinhaResumoSemanal[] = [];
    const hoje = new Date();
    [4, 3, 4, 2, 0, 3, 4].forEach((qtd, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6 + i);
      const dia = d.toLocaleDateString('sv-SE');
      ['LINGUAGENS', 'HUMANAS', 'NATUREZAS', 'EXATAS'].forEach((area, k) => {
        if (qtd === 0) return;
        const acerto = k < qtd ? 1 : 0;
        linhas.push({ dia, area, respondidas: 1, acertos: acerto, xp: acerto ? 45 + ((i * 7 + k * 11) % 26) : 0, tempo: 60 + k * 15 });
      });
    });
    return linhas;
  }

  private aplicar(linhas: LinhaResumoSemanal[]) {
    const u = this.usuario!;
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6);
    this.periodo = `${inicio.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')} – ${hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')}`;

    const porArea: Record<ChaveArea, { r: number; a: number }> = { linguagens: { r: 0, a: 0 }, humanas: { r: 0, a: 0 }, naturezas: { r: 0, a: 0 }, exatas: { r: 0, a: 0 } };
    this.dias = Array.from({ length: 7 }, (_, i) => {
      const data = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
      const chave = data.toLocaleDateString('sv-SE');
      const doDia = linhas.filter(l => l.dia === chave);
      const cores = ORDEM_SIMBOLO.map(c => {
        const l = doDia.find(x => x.area?.toLowerCase() === c);
        if (!l) return null;
        return l.acertos > 0 ? AREAS.find(a => a.chave === c)!.cor : COR_ERRO;
      });
      doDia.forEach(l => {
        const k = l.area?.toLowerCase() as ChaveArea;
        if (porArea[k]) { porArea[k].r += l.respondidas; porArea[k].a += l.acertos; }
      });
      return {
        data, letra: LETRAS[data.getDay()], hoje: i === 6,
        respondidas: doDia.reduce((s, l) => s + l.respondidas, 0),
        acertos: doDia.reduce((s, l) => s + l.acertos, 0),
        xp: doDia.reduce((s, l) => s + l.xp, 0),
        cores
      };
    });
    this.xp = this.dias.reduce((s, d) => s + d.xp, 0);
    this.respondidas = this.dias.reduce((s, d) => s + d.respondidas, 0);
    this.acertos = this.dias.reduce((s, d) => s + d.acertos, 0);
    this.taxa = this.respondidas ? Math.round((this.acertos / this.respondidas) * 100) : 0;
    this.diasAtivos = this.dias.filter(d => d.respondidas > 0).length;
    this.sequencia = u.streakDiasAtivos ?? 0;
    const melhores = AREAS.filter(a => porArea[a.chave].r > 0).map(a => ({ info: a, pct: Math.round((porArea[a.chave].a / porArea[a.chave].r) * 100), acertos: porArea[a.chave].a })).sort((x, y) => y.pct - x.pct || y.acertos - x.acertos);
    this.melhorArea = melhores[0] ?? null;

    this.depois = progressoDoUsuario(u);
    this.antes = calcularProgresso({
      acertos: {
        linguagens: Math.max(0, (u.linguagens?.acertos ?? 0) - porArea.linguagens.a),
        humanas: Math.max(0, (u.humanas?.acertos ?? 0) - porArea.humanas.a),
        naturezas: Math.max(0, (u.naturezas?.acertos ?? 0) - porArea.naturezas.a),
        exatas: Math.max(0, (u.exatas?.acertos ?? 0) - porArea.exatas.a)
      },
      diasAtivos: Math.max(0, (u.qntDiasAtivos ?? 0) - this.diasAtivos)
    });
    this.totalPecas = totalDePecas(this.depois);
    this.pecasNovas = Math.max(0, this.totalPecas - totalDePecas(this.antes));

    const extras = this.premium.paraExtras(this.premium.atual);
    const arte = renderizarCampus(this.depois, paletaDe(false), { extras });
    const [x, y, w, h] = arte.terreno;
    this.campusArte = this.sanitizer.bypassSecurityTrustHtml(arte.svg.replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${w} ${h}"`));
    this.carregando = false;
    this.rodarLapse();
    this.timers.push(setTimeout(() => this.ajustarEscala()));
  }

  rodarLapse() {
    this.ciclo++;
    const n = this.pecasNovas;
    const intervalo = n ? Math.max(90, Math.min(480, 4200 / n)) : 0;
    const inicio = 700;
    const extras = this.premium.paraExtras(this.premium.atual);
    const cena = renderizarCampus(this.depois, paletaDe(this.noite), { novasDesde: this.antes, atrasoInicial: inicio, intervalo, extras });
    const [x, y, w, h] = cena.terreno;
    this.timelapse = this.sanitizer.bypassSecurityTrustHtml(cena.svg.replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${w} ${h}"`));
    this.duracaoLapse = inicio + n * intervalo;
    this.pecasMostradas = 0;
    const t0 = performance.now();
    const passo = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - t0 - inicio) / Math.max(1, this.duracaoLapse - inicio)));
      this.pecasMostradas = Math.round(n * k);
      if (k < 1 && !this.fechando) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  }

  get frase(): string {
    if (this.diasAtivos === 7) return 'Semana perfeita: 7 de 7 dias.';
    if (this.diasAtivos >= 5) return 'A constância está aparecendo!';
    if (this.diasAtivos >= 3) return 'Boa semana. Bora fechar a próxima com mais dias.';
    if (this.diasAtivos >= 1) return 'Toda semana conta. A próxima pode ser maior.';
    return 'Uma semana nova começa agora.';
  }

  async compartilhar() {
    const el = this.arteRef?.nativeElement;
    if (!el || this.gerando) return;
    this.gerando = true;
    this.aviso = '';
    try {
      const blob = await gerarPng(el, 1080, 1920, ['Schibsted Grotesk']);
      const nome = `minha-semana-enemdaily.png`;
      const ok = await compartilharArquivo(blob, nome, 'Minha semana no desafio diário do enem.daily 🎓');
      if (!ok) {
        baixarArquivo(blob, nome);
        this.aviso = 'Imagem salva. Agora é só postar nos stories!';
      }
    } catch {
      this.aviso = 'Não foi possível gerar a imagem. Tente de novo.';
    } finally {
      this.gerando = false;
    }
  }

  async baixar() {
    const el = this.arteRef?.nativeElement;
    if (!el || this.gerando) return;
    this.gerando = true;
    try {
      baixarArquivo(await gerarPng(el, 1080, 1920, ['Schibsted Grotesk']), 'minha-semana-enemdaily.png');
      this.aviso = 'Imagem salva na sua galeria de downloads.';
    } catch {
      this.aviso = 'Não foi possível gerar a imagem.';
    } finally {
      this.gerando = false;
    }
  }

  @HostListener('document:keydown.escape')
  sair() {
    if (this.fechando) return;
    this.fechando = true;
    this.timers.push(setTimeout(() => this.fechar.emit(), 260));
  }

  get site(): string {
    return location.host.replace(/^www\./, '');
  }
}

import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AdminService, AssuntoAdmin, DetalheDia, DiaAtividade, EstadoGeracao, ResumoAdmin, UsuarioAdmin } from '../services/admin.service';
import { AREAS, InfoArea } from '../shared/dia';
import { FirebaseServiceService } from '../services/firebase-service.service';
import { lerAvatar } from '../shared/avatar/avatar';
import { IconeComponent } from '../shared/icone/icone.component';
import { AvatarComponent } from '../shared/avatar/avatar.component';
import { CarregandoComponent } from '../shared/carregando/carregando.component';

const ENUM_PARA_CHAVE: Record<string, string> = { NATUREZAS: 'naturezas', HUMANAS: 'humanas', EXATAS: 'exatas', LINGUAGENS: 'linguagens' };
const ORDINAL_PARA_ENUM = ['NATUREZAS', 'HUMANAS', 'EXATAS', 'LINGUAGENS'];

interface CelulaDia { data: string; numero: number; doMes: boolean; hoje: boolean; futuro: boolean; respostas: number; ativos: number; nivel: number; }

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, RouterLink, IconeComponent, AvatarComponent, CarregandoComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit, OnDestroy {
  private api = inject(AdminService);
  private firebase = inject(FirebaseServiceService);

  readonly areas = AREAS;
  readonly semana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  readonly nomesMes = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  acessoNegado = false;
  liberado = false;
  chaveRecusada = false;
  semConexao = false;
  private tentativa: ReturnType<typeof setTimeout> | null = null;
  chave = this.api.chave;
  resumo: ResumoAdmin | null = null;

  busca = '';
  pagina = 0;
  totalUsuarios = 0;
  usuarios: UsuarioAdmin[] = [];
  carregandoUsuarios = true;
  private busca$ = new Subject<string>();

  mes = this.inicioDoMes(new Date());
  celulas: CelulaDia[] = [];
  diaSelecionado = this.iso(new Date());
  detalhe: DetalheDia | null = null;
  carregandoDia = false;

  diaGeracao: 'hoje' | 'amanha' = 'hoje';
  substituir = false;
  status: Record<string, EstadoGeracao> = {};
  disparando = false;
  avisoGeracao = '';
  private questoesDoDiaGeracao: DetalheDia['questoes'] = [];
  private poll: ReturnType<typeof setInterval> | null = null;

  excluindo: UsuarioAdmin | null = null;
  confirmacao = '';
  apagando = false;
  resultadoExclusao: { nome: string; itens: [string, number][] } | null = null;

  assuntos: AssuntoAdmin[] = [];
  areaAssuntos = 'NATUREZAS';
  novoAssunto = '';
  salvandoAssunto = false;
  erroAssunto = '';
  confirmandoAssunto: number | null = null;
  readonly areasEnum = ORDINAL_PARA_ENUM;

  private subs = new Subscription();

  ngOnInit() {
    this.subs.add(this.busca$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(b => { this.carregandoUsuarios = true; this.pagina = 0; return this.api.usuarios(b, 0); })
    ).subscribe({ next: p => this.receberUsuarios(p), error: e => this.falha(e) }));
    this.recarregarTudo();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.pararPoll();
    if (this.tentativa) clearTimeout(this.tentativa);
  }

  recarregarTudo() {
    this.acessoNegado = false;
    this.semConexao = false;
    if (this.tentativa) { clearTimeout(this.tentativa); this.tentativa = null; }
    this.api.resumo().subscribe({ next: r => { this.resumo = r; this.liberado = true; }, error: e => this.falha(e) });
    this.carregarUsuarios();
    this.carregarMes();
    this.selecionarDia(this.diaSelecionado);
    this.atualizarGeracao();
    this.carregarAssuntos();
  }

  salvarChave() {
    this.api.chave = this.chave.trim();
    this.recarregarTudo();
  }

  buscar(v: string) { this.busca$.next(v.trim()); }

  carregarUsuarios() {
    this.carregandoUsuarios = true;
    this.api.usuarios(this.busca.trim(), this.pagina).subscribe({ next: p => this.receberUsuarios(p), error: e => this.falha(e) });
  }

  private receberUsuarios(p: { total: number; usuarios: UsuarioAdmin[]; pagina: number }) {
    this.usuarios = p.usuarios;
    this.totalUsuarios = p.total;
    this.pagina = p.pagina;
    this.carregandoUsuarios = false;
  }

  get totalPaginas(): number { return Math.max(1, Math.ceil(this.totalUsuarios / 30)); }

  irParaPagina(p: number) {
    if (p < 0 || p >= this.totalPaginas) return;
    this.pagina = p;
    this.carregarUsuarios();
  }

  taxa(u: UsuarioAdmin): string {
    return u.respondidas ? Math.round((100 * u.acertos) / u.respondidas) + '%' : '—';
  }

  pedirExclusao(u: UsuarioAdmin) {
    this.excluindo = u;
    this.confirmacao = '';
    this.resultadoExclusao = null;
  }

  get podeExcluir(): boolean {
    return !!this.excluindo && this.confirmacao.trim().toLowerCase() === (this.excluindo.usuario ?? '').toLowerCase();
  }

  confirmarExclusao() {
    const u = this.excluindo;
    if (!u || !this.podeExcluir) return;
    this.apagando = true;
    this.api.excluir(u.id).subscribe({
      next: async resposta => {
        const { caminhosAnexos = [], ...contagem } = resposta;
        let r: Record<string, number> = contagem as Record<string, number>;
        const fotos = await this.firebase.apagaFotosDoUsuario(u.id, lerAvatar(u.avatar, u.nome).fotoCaminho);
        if (fotos) r = { ...r, fotosFirebase: fotos };
        if (caminhosAnexos.length) {
          await this.firebase.apagaAnexosRedacao(caminhosAnexos);
          r = { ...r, anexosRedacao: caminhosAnexos.length };
        }
        this.apagando = false;
        this.excluindo = null;
        const rotulos: Record<string, string> = {
          eventos: 'Respostas e eventos', simulados: 'Simulados', redacoes: 'Redações', conteudosEstudados: 'Assuntos marcados como estudados', mentor: 'Plano e histórico do Meu cronograma', amizades: 'Amizades e pedidos',
          duelos: 'Duelos', bloqueios: 'Bloqueios', inscricoesPush: 'Inscrições de notificação',
          participacoesEmGrupos: 'Participações em grupos', atividadesEmGrupos: 'Atividades em grupos',
          gruposTransferidos: 'Grupos com admin transferido', gruposApagados: 'Grupos apagados (sem outros membros)',
          fotosFirebase: 'Fotos de perfil no Firebase', anexosRedacao: 'Fotos e PDFs de redações'
        };
        this.resultadoExclusao = {
          nome: u.nome || u.usuario,
          itens: Object.entries(r).filter(([k, v]) => k !== 'usuario' && v > 0).map(([k, v]) => [rotulos[k] ?? k, v])
        };
        this.carregarUsuarios();
        this.api.resumo().subscribe(res => (this.resumo = res));
        this.carregarMes();
        this.selecionarDia(this.diaSelecionado);
      },
      error: e => { this.apagando = false; this.falha(e); }
    });
  }

  mudarMes(delta: number) {
    this.mes = new Date(this.mes.getFullYear(), this.mes.getMonth() + delta, 1);
    this.carregarMes();
  }

  get podeAvancarMes(): boolean {
    const hoje = new Date();
    return this.mes < new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  }

  get tituloMes(): string {
    const nome = this.nomesMes[this.mes.getMonth()];
    return `${nome[0].toUpperCase()}${nome.slice(1)} de ${this.mes.getFullYear()}`;
  }

  get totalMes(): { respostas: number; diasAtivos: number; picoAtivos: number } {
    const dias = this.celulas.filter(c => c.doMes && c.respostas > 0);
    return {
      respostas: dias.reduce((s, c) => s + c.respostas, 0),
      diasAtivos: dias.length,
      picoAtivos: dias.reduce((m, c) => Math.max(m, c.ativos), 0)
    };
  }

  carregarMes() {
    const chaveMes = `${this.mes.getFullYear()}-${String(this.mes.getMonth() + 1).padStart(2, '0')}`;
    this.montarCelulas([]);
    this.api.atividadeDoMes(chaveMes).subscribe({ next: d => this.montarCelulas(d), error: e => this.falha(e) });
  }

  private montarCelulas(dados: DiaAtividade[]) {
    const porDia = new Map(dados.map(d => [d.dia, d]));
    const max = Math.max(1, ...dados.map(d => d.ativos));
    const hoje = this.iso(new Date());
    const ini = new Date(this.mes.getFullYear(), this.mes.getMonth(), 1 - this.mes.getDay());
    const celulas: CelulaDia[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i);
      if (i >= 35 && d.getMonth() !== this.mes.getMonth()) break;
      const data = this.iso(d);
      const info = porDia.get(data);
      const ativos = info?.ativos ?? 0;
      celulas.push({
        data, numero: d.getDate(), doMes: d.getMonth() === this.mes.getMonth(), hoje: data === hoje, futuro: data > hoje,
        respostas: info?.respostas ?? 0, ativos,
        nivel: ativos === 0 ? 0 : Math.min(4, Math.ceil((4 * ativos) / max))
      });
    }
    this.celulas = celulas;
  }

  selecionarDia(data: string) {
    this.diaSelecionado = data;
    this.carregandoDia = true;
    this.api.atividadeDoDia(data).subscribe({
      next: d => { this.detalhe = d; this.carregandoDia = false; },
      error: e => { this.carregandoDia = false; this.falha(e); }
    });
  }

  get diaSelecionadoTexto(): string {
    const [a, m, d] = this.diaSelecionado.split('-').map(Number);
    const dt = new Date(a, m - 1, d);
    const sem = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][dt.getDay()];
    return `${sem}, ${d} de ${this.nomesMes[m - 1]}`;
  }

  infoAreaEnum(nome: string): InfoArea | undefined {
    return AREAS.find(a => a.chave === ENUM_PARA_CHAVE[nome]);
  }

  areaDaQuestao(ordinal: number): InfoArea | undefined {
    return this.infoAreaEnum(ORDINAL_PARA_ENUM[ordinal]);
  }

  pct(a: number, b: number): string { return b ? Math.round((100 * a) / b) + '%' : '—'; }

  get dataGeracao(): string {
    const d = new Date();
    if (this.diaGeracao === 'amanha') d.setDate(d.getDate() + 1);
    return this.iso(d);
  }

  escolherDiaGeracao(d: 'hoje' | 'amanha') {
    this.diaGeracao = d;
    this.avisoGeracao = '';
    this.atualizarGeracao();
  }

  atualizarGeracao() {
    this.api.statusGeracao().subscribe({
      next: s => {
        this.status = s;
        if (this.algumaEmAndamento) this.iniciarPoll(); else this.pararPoll();
      },
      error: e => this.falha(e)
    });
    this.api.atividadeDoDia(this.dataGeracao).subscribe({ next: d => (this.questoesDoDiaGeracao = d.questoes), error: () => {} });
  }

  get algumaEmAndamento(): boolean { return Object.values(this.status).some(s => s.emAndamento); }

  get linhasGeracao() {
    return ORDINAL_PARA_ENUM.map((nome, ordinal) => {
      const info = this.infoAreaEnum(nome)!;
      const questao = this.questoesDoDiaGeracao.find(q => q.area === ordinal) ?? null;
      const st = this.status[nome];
      const doDia = st && st.dia === this.dataGeracao ? st : null;
      return { nome, info, questao, status: doDia };
    });
  }

  get faltando(): number { return this.linhasGeracao.filter(l => !l.questao).length; }

  gerar(area?: string) {
    this.disparando = true;
    this.avisoGeracao = '';
    this.api.gerarQuestoes(this.diaGeracao, this.substituir, area).subscribe({
      next: r => {
        this.disparando = false;
        this.avisoGeracao = r.iniciadas.length
          ? `Geração iniciada: ${r.iniciadas.map(a => this.infoAreaEnum(a)?.nome ?? a).join(', ')}. Leva de 1 a 5 minutos por área.`
          : this.substituir ? 'Já existe uma geração em andamento para essas áreas.' : 'Nada a gerar: todas as áreas já têm questão nesse dia.';
        this.atualizarGeracao();
      },
      error: e => {
        this.disparando = false;
        this.falha(e);
        if (e instanceof HttpErrorResponse && e.status === 0) this.avisoGeracao = 'Não foi possível falar com o backend. Confira se ele está no ar.';
        if (e instanceof HttpErrorResponse && e.status === 403) this.avisoGeracao = 'O servidor recusou o pedido (acesso de admin).';
      }
    });
  }

  custo(s: EstadoGeracao | null): string {
    return s && s.custoUsd > 0 ? 'US$ ' + s.custoUsd.toFixed(2).replace('.', ',') : '';
  }

  private iniciarPoll() {
    if (this.poll) return;
    this.poll = setInterval(() => {
      this.api.statusGeracao().subscribe({
        next: s => {
          const antes = this.algumaEmAndamento;
          this.status = s;
          if (antes && !this.algumaEmAndamento) {
            this.pararPoll();
            this.atualizarGeracao();
            if (this.diaSelecionado === this.dataGeracao) this.selecionarDia(this.diaSelecionado);
          }
        },
        error: () => {}
      });
    }, 4000);
  }

  private pararPoll() {
    if (this.poll) clearInterval(this.poll);
    this.poll = null;
  }

  carregarAssuntos() {
    this.api.assuntos().subscribe({ next: a => (this.assuntos = a), error: e => this.falha(e) });
  }

  get assuntosDaArea(): AssuntoAdmin[] { return this.assuntos.filter(a => a.area === this.areaAssuntos); }

  contarAssuntos(area: string): number { return this.assuntos.filter(a => a.area === area).length; }

  escolherAreaAssuntos(area: string) {
    this.areaAssuntos = area;
    this.erroAssunto = '';
    this.confirmandoAssunto = null;
  }

  adicionarAssunto() {
    const nome = this.novoAssunto.trim();
    if (!nome || this.salvandoAssunto) return;
    this.salvandoAssunto = true;
    this.erroAssunto = '';
    this.api.adicionarAssunto(nome, this.areaAssuntos).subscribe({
      next: () => { this.salvandoAssunto = false; this.novoAssunto = ''; this.carregarAssuntos(); },
      error: (e: HttpErrorResponse) => {
        this.salvandoAssunto = false;
        this.erroAssunto = e.error?.erro ?? 'Não foi possível adicionar o assunto.';
        this.falha(e);
      }
    });
  }

  excluirAssunto(a: AssuntoAdmin) {
    if (this.confirmandoAssunto !== a.id) { this.confirmandoAssunto = a.id; return; }
    this.confirmandoAssunto = null;
    this.api.excluirAssunto(a.id).subscribe({ next: () => this.carregarAssuntos(), error: e => this.falha(e) });
  }

  dataCurta(v: string | null): string {
    if (!v) return '—';
    const [a, m, d] = v.slice(0, 10).split('-');
    return `${d}/${m}/${a.slice(2)}`;
  }

  private falha(e: unknown) {
    this.carregandoUsuarios = false;
    if (!(e instanceof HttpErrorResponse)) return;
    if (e.status === 403) { this.acessoNegado = true; this.liberado = false; this.chaveRecusada = !!this.api.chave; return; }
    if (e.status === 0) {
      this.semConexao = true;
      if (!this.tentativa) this.tentativa = setTimeout(() => { this.tentativa = null; this.recarregarTudo(); }, 5000);
      return;
    }
    this.avisoGeracao = `O servidor respondeu com erro ${e.status}. Veja o log do backend.`;
  }

  private inicioDoMes(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }

  private iso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Usuario } from '../models/usuario';
import { AuthServiceService } from '../services/auth-service.service';
import { CampusComponent } from '../shared/campus/campus.component';
import { IconeComponent } from '../shared/icone/icone.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EstruturasPremiumService } from '../services/estruturas-premium.service';
import { ExtrasCampus, MARCOS, ROTULO_METRICA, miniaturaMarco, valorMetrica } from '../shared/campus/especiais';
import { nomeDoNivel } from '../shared/campus/acabamentos';
import { NEGOCIOS, negociosAbertos, proximoNegocio } from '../shared/campus/alimentacao';
import { nivelAcabamento, paletaDe, Progresso, REGIOES, TOTAL_PECAS, TOTAL_POR_TRILHA, Trilha, proximaPeca, progressoDoUsuario, totalDePecas, ultimaPeca } from '../shared/campus/campus';

interface CartaoRegiao {
  trilha: Trilha;
  nome: string;
  cor: string;
  destaque: string;
  regra: string;
  feitas: number;
  total: number;
  pct: number;
  proxima: string | null;
  ultima: string | null;
}

interface CartaoPremium {
  nome: string;
  descricao: string;
  requisito: string;
  icone: string;
  feitas: number;
  meta: number;
  liberada: boolean;
  svg: SafeHtml;
  rota: string | null;
  acao: string;
}

@Component({
  selector: 'app-university',
  standalone: true,
  imports: [CampusComponent, IconeComponent],
  templateUrl: './university.component.html',
  styleUrl: './university.component.css'
})
export class UniversityComponent implements OnInit, OnDestroy {
  usuario: Usuario | null = null;
  progresso: Progresso = progressoDoUsuario(null);
  total = 0;
  readonly totalCampus = TOTAL_PECAS;
  cartoes: CartaoRegiao[] = [];
  foco: Trilha | null = null;
  modo: 'dia' | 'noite' = (new Date().getHours() >= 18 || new Date().getHours() < 6) ? 'noite' : 'dia';
  private sub?: Subscription;
  extras: ExtrasCampus | null = null;
  upgrades: CartaoPremium[] = [];
  distrito: CartaoPremium[] = [];

  constructor(private authService: AuthServiceService, private router: Router, private premiumService: EstruturasPremiumService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.montarPremium();
    this.sub = this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
      if (!usuario) { this.router.navigate(['/Home']); return; }
      this.progresso = progressoDoUsuario(usuario);
      this.total = totalDePecas(this.progresso);
      this.cartoes = REGIOES.map(r => {
        const feitas = this.progresso[r.trilha], total = TOTAL_POR_TRILHA[r.trilha];
        return {
          trilha: r.trilha, nome: r.nome, cor: r.cor, destaque: r.destaque, regra: r.regra, feitas, total,
          pct: Math.round(feitas / total * 100),
          proxima: proximaPeca(r.trilha, this.progresso)?.nome ?? nomeDoNivel(nivelAcabamento(r.trilha, this.progresso) + 1),
          ultima: ultimaPeca(r.trilha, this.progresso)?.nome ?? null,
        };
      });
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.subPremium?.unsubscribe();
  }

  private subPremium?: Subscription;

  private montarPremium() {
    this.subPremium = this.premiumService.contagem$.subscribe(c => {
      this.extras = c.carregado ? this.premiumService.paraExtras(c) : null;
      const P = paletaDe(this.modo === 'noite');
      const e = this.premiumService.paraExtras(c);
      const cartoes = MARCOS.map(m => {
        const feitas = valorMetrica(e, m.metrica);
        const rota = m.metrica === 'simulados' ? '/simulados' : m.metrica === 'redacoes' ? '/redacoes' : m.metrica === 'estudos' ? '/simulados' : null;
        if (m.chave === 'alimentacao' && feitas >= m.meta) {
          const abertos = negociosAbertos(feitas), prox = proximoNegocio(feitas);
          return {
            grupo: m.grupo, nome: m.nome, icone: m.icone, liberada: true,
            descricao: `${abertos} de ${NEGOCIOS.length} negócios abertos.` + (prox ? ` Próximo: ${prox.nome}, em ${prox.faltam} ${prox.faltam === 1 ? 'acerto' : 'acertos'}.` : ' Todos abertos!'),
            requisito: 'Um negócio a cada 30 acertos', feitas: abertos, meta: NEGOCIOS.length,
            svg: this.sanitizer.bypassSecurityTrustHtml(miniaturaMarco(m.chave, P)), rota, acao: 'Responder o desafio'
          };
        }
        return {
          grupo: m.grupo,
          nome: m.nome, descricao: m.descricao, icone: m.icone, meta: m.meta,
          requisito: `${m.meta} ${ROTULO_METRICA[m.metrica]}`,
          feitas: Math.min(feitas, m.meta), liberada: feitas >= m.meta,
          svg: this.sanitizer.bypassSecurityTrustHtml(miniaturaMarco(m.chave, P)),
          rota, acao: m.metrica === 'redacoes' ? 'Registrar redação' : m.metrica === 'acertos' || m.metrica === 'sequencia' || m.metrica === 'dias' ? 'Responder o desafio' : 'Registrar simulado'
        };
      });
      this.upgrades = cartoes.filter(x => x.grupo === 'campus');
      this.distrito = cartoes.filter(x => x.grupo === 'distrito');
    });
  }

  irDesafio() {
    this.router.navigate(['/Home']);
  }

  irPara(rota: string) {
    this.router.navigate([rota]);
  }

  focar(t: Trilha) {
    this.foco = this.foco === t || t === 'geral' ? null : t;
    if (this.foco) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  verRegioes() {
    document.getElementById('regioes')?.scrollIntoView({ behavior: 'smooth' });
  }
}

import { Routes } from '@angular/router';
import { HomeComponentComponent } from './home-component/home-component.component';

export const routes: Routes = [
  { path: '', component: HomeComponentComponent },
  { path: 'Home', component: HomeComponentComponent },
  { path: 'desafioHome', redirectTo: 'Home' },
  { path: 'desafio/:area', loadComponent: () => import('./desafio/desafio.component').then(m => m.DesafioComponent) },
  { path: 'homeGrupos', loadComponent: () => import('./home-grupos/home-grupos.component').then(m => m.HomeGruposComponent) },
  { path: 'grupo/:id', loadComponent: () => import('./grupo/grupo.component').then(m => m.GrupoComponent) },
  { path: 'progresso', loadComponent: () => import('./university/university.component').then(m => m.UniversityComponent) },
  { path: 'estatisticas', loadComponent: () => import('./estatisticas-page/estatisticas-page.component').then(m => m.EstatisticasPageComponent) },
  { path: 'privacidade', loadComponent: () => import('./termos-privacidade/termos-privacidade.component').then(m => m.TermosPrivacidadeComponent) },
  { path: 'contato', loadComponent: () => import('./contato/contato.component').then(m => m.ContatoComponent) },
  { path: 'simulados', loadComponent: () => import('./home-simulados/home-simulados.component').then(m => m.HomeSimuladosComponent) },
  { path: 'redacoes', loadComponent: () => import('./home-redacoes/home-redacoes.component').then(m => m.HomeRedacoesComponent) },
  { path: 'estudos', loadComponent: () => import('./landing/estudos/landing-estudos.component').then(m => m.LandingEstudosComponent) },
  { path: 'amigos', loadComponent: () => import('./comunidade/comunidade.component').then(m => m.ComunidadeComponent) },
  { path: 'comunidade', redirectTo: 'amigos' },
  { path: 'u/:usuario', loadComponent: () => import('./comunidade/perfil-publico/perfil-publico.component').then(m => m.PerfilPublicoComponent) },
  { path: 'configuracoes', loadComponent: () => import('./configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent) },
  { path: 'admin', loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent) },
  { path: 'admin/conteudos', loadComponent: () => import('./admin/conteudos/admin-conteudos.component').then(m => m.AdminConteudosComponent) },
  { path: 'conteudos', loadComponent: () => import('./conteudos/indice/conteudos-indice.component').then(m => m.ConteudosIndiceComponent) },
  { path: 'conteudos/:area/:slug', loadComponent: () => import('./conteudos/pagina/conteudo-pagina.component').then(m => m.ConteudoPaginaComponent) }
];

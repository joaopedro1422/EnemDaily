import { Injectable } from '@angular/core';
import Shepherd from 'shepherd.js';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
private tour!: any;

  start(): void {
    this.tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        scrollTo: true,
        cancelIcon: {
          enabled: true
        },
        classes: 'enem-shepherd'
      }
    });

    this.tour.addStep({
      id: 'welcome',
      text: `
        
        Novo por aqui? para que você tenha uma primeira experiência completa.
      `,
      buttons: [
        {
          text: 'Pular',
          action: this.tour.cancel
        },
        {
          text: 'Continuar',
          action: this.tour.next
        }
      ]
    });

    this.tour.addStep({
      id: 'daily-challenge',
      classes: 'enem-step-slide',
      attachTo: {
        element: '#daily-challenge-card',
        on: 'top'
      },
      text: `
        📘 <strong>Desafio diário</strong><br>
        Todo dia você responde <strong>1 questão de cada área do Enem</strong>.
      `,
      buttons: [
        { text: 'Voltar', action: this.tour.back },
        { text: 'Continuar', action: this.tour.next }
      ]
    });

    this.tour.addStep({
      id: 'xp',
      attachTo: {
        element: '#xp-bar',
        on: 'bottom'
      },
      text: `
        ⚡ <strong>Ganhe XP</strong><br>
        Acerte rápido para ganhar mais pontos e desbloquear avatares.
      `,
      buttons: [
        { text: 'Voltar', action: this.tour.back },
        { text: 'Continuar', action: this.tour.next }
      ]
    });

    this.tour.addStep({
      id: 'groups',
      attachTo: {
        element: '#groups-section',
        on: 'top'
      },
      text: `
        🧑‍🤝‍🧑 <strong>Grupos de competição</strong><br>
        Crie grupos com amigos, cursinhos ou mentorias e dispute rankings.
      `,
      buttons: [
        { text: 'Voltar', action: this.tour.back },
        { text: 'Continuar', action: this.tour.next }
      ]
    });

    this.tour.addStep({
      id: 'stats',
      attachTo: {
        element: '#weekly-summary',
        on: 'top'
      },
      text: `
        📊 <strong>Resumo semanal</strong><br>
        Veja seus pontos fortes e onde melhorar toda semana.
      `,
      buttons: [
        { text: 'Voltar', action: this.tour.back },
        { text: 'Continuar', action: this.tour.next }
      ]
    });

    this.tour.addStep({
      id: 'cta',
      attachTo: {
        element: '#start-challenge-btn',
        on: 'top'
      },
      text: `
        🚀 <strong>Pronto para começar?</strong><br>
        Resolva agora seu <strong>primeiro desafio gratuito</strong>.
      `,
      buttons: [
        {
          text: 'Começar',
          action: () => {
            localStorage.setItem('enem_daily_onboarding_done', 'true');
            this.tour.complete();
          }
        }
      ]
    });

    this.tour.start();
  }
}

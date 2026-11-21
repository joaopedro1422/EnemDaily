import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-onboarding-balloon',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './onboarding-balloon.component.html',
  styleUrl: './onboarding-balloon.component.css'
})
export class OnboardingBalloonComponent implements OnInit{
 visible = false;
 @Output() retorno = new EventEmitter<any>();
  steps: string[] = [
    '👋 Bem-vindo ao Enem.Daily!\nA sua plataforma completa de preparação rumo ao Enem.',
    'Aqui você encontrará um Game diário desenvolvido estrategicamente, com foco em micro-fixação diária de conteúdos. \n Além disso, você também terá acesso ao nosso gestor de estudos, uma ferramenta completa para você acompanhar a sua evolução nos Simulados e Redações realizadas durante o ano de forma detalhada.',
    '🎮 Nosso Desafio diário é composto por uma questão diária de cada área presente no Enem, com explicação detalhada e nível baseado nas últimas edições do ENEM. \n\n⭐ Ao responder corretamente, você receberá XP de acordo com o tempo gasto para concluir a questão e poderá evoluir o nível do seu campus universitário virtual e competir entre amigos! \n\n🤖  Com nosso cronograma inteligente, ao longo do ano você verá os principais assuntos mais presentes nas últimas 16 edições do ENEM. \n Assim, você fixa conteúdos importantes diariamente em poucos minutos, de onde estiver!',
    'O nosso gestor de estudos permite um acompanhamento completo das suas atividades realizadas durante o ano de estudos com dados, estatísticas, gráficos e análises personalizadas! \n\n 📄  Gestor de Simulados: Obtenha um histórico completo em suas mãos com estatísticas para cada área e dia de prova, gráficos, análise de crescimento, anotações para cada simulado e muito mais!. \n\n 📝 Gestor de Redações: Obtenha uma análise detalhada das suas competências e saiba exatamente onde melhorar para aumentar a sua nota final! Além de diversas métricas importantes sobre o seu histórico de redações.',
    'Mas nada melhor do que experimentar você mesmo! \n\n Continue para logar automaticamente em nossa conta Demo e conferir tudo que o Enem.Daily pode te oferecer gratuitamente ou cadastre-se para começar agora mesmo a sua jornada.'
  ];

  stepIndex = 0;

  fullText = '';
  displayedText = '';
  charIndex = 0;

  typingSpeed = 35;
  typingTimeout: any;

  ngOnInit(): void {
    
      this.visible = true;
      this.startTyping();
    
  }

  ngOnDestroy(): void {
    this.clearTyping();
  }

  startTyping(): void {
    this.clearTyping();

    this.fullText = this.steps[this.stepIndex];
    this.displayedText = '';
    this.charIndex = 0;

    this.typeNextChar();
  }

  typeNextChar(): void {
    if (this.charIndex < this.fullText.length) {
      this.displayedText += this.fullText[this.charIndex];
      this.charIndex++;

      this.typingTimeout = setTimeout(() => {
        this.typeNextChar();
      }, this.typingSpeed);
    }
  }

  next(): void {
    if (this.charIndex < this.fullText.length) {
      this.clearTyping();
      this.displayedText = this.fullText;
      this.charIndex = this.fullText.length;
      return;
    }

    if (this.stepIndex === this.steps.length - 1) {
      localStorage.setItem('enem_daily_onboarding_done', 'true');
      this.visible = false;
      return;
    }

    this.stepIndex++;
    this.startTyping();
  }
  logarDemo(){
     localStorage.setItem('enem_daily_onboarding_done', 'true');
     this.visible = false;
     this.retorno.emit('logar');
  }

  cadastro(){
    localStorage.setItem('enem_daily_onboarding_done', 'true');
     this.visible = false;
     this.retorno.emit('cadastro');
  }

  clearTyping(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }
}

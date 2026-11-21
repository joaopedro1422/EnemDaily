import { CarregandoComponent } from '../shared/carregando/carregando.component';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-contato',
  imports: [CommonModule, FormsModule, FooterComponent, CarregandoComponent],
  templateUrl: './contato.component.html',
  styleUrl: './contato.component.css'
})
export class ContatoComponent {
loading = false;
msgOk = '';
msgErro = '';

model = {
  nome: '',
  email: '',
  assunto: '',
  mensagem: ''
};

enviar() {
  this.msgOk = '';
  this.msgErro = '';
  this.loading = true;

  setTimeout(() => {
    this.loading = false;
    this.msgOk = 'Mensagem enviada! Vamos te responder por e-mail.';
    this.limpar();
  }, 900);
}

limpar() {
  this.model = { nome: '', email: '', assunto: '', mensagem: '' };
}
}

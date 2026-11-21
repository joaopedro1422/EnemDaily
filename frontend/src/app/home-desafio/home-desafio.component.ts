import { Component, OnDestroy, OnInit } from '@angular/core';
import { find, interval, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { SessionService } from '../services/sessionService';
import { Usuario } from '../models/usuario';

import { CommonModule } from '@angular/common';
import { UsuarioService } from '../services/usuario.service';
import { FooterComponent } from '../footer/footer.component';
import { AuthModalComponent } from '../modal/auth-modal/auth-modal.component';
import { AuthServiceService } from '../services/auth-service.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-home-desafio',
  imports: [CommonModule, FooterComponent, AuthModalComponent],
  templateUrl: './home-desafio.component.html',
  styleUrl: './home-desafio.component.css'
})
export class HomeDesafioComponent implements OnInit, OnDestroy{
  mostrarModal = false;
  tempoRestante!: string;
  percent = 90;
  usuarioLogado!: Usuario | null;
  naturezasRespondida!: boolean;
  exatasRespondida!: boolean;
  linguagensRespondida!: boolean;
  humanasRespondida!: boolean;
  dataHoje= '';
  dataHojeExibicao= '';
  respostasHoje = 0;
  private timerSub!: Subscription;
 
  ngOnInit(): void {
   
      this.usuarioService.getUsuariosHoje().subscribe({
        next : (res) => {
          this.respostasHoje = res * 3;
        },
        error: (err) =>{
          console.log(err);
        }
      })
      this.dataHoje = new Date().toLocaleDateString('en-CA');;
      this.dataHojeExibicao =new Date().toLocaleDateString('pt-BR');
       this.authService.usuario$.subscribe(usuario => {
          this.usuarioLogado = usuario;
          if(!this.usuarioLogado){
            this.router.navigate(['/Home']);
            return;
          }
          this.naturezasRespondida = this.usuarioLogado.naturezas.ultimaResposta === this.dataHoje;
          this.exatasRespondida = this.usuarioLogado.exatas.ultimaResposta  === this.dataHoje;
          this.humanasRespondida = this.usuarioLogado.humanas.ultimaResposta === this.dataHoje;
          this.linguagensRespondida = this.usuarioLogado.linguagens.ultimaResposta === this.dataHoje;
          console.log(this.exatasRespondida);
          console.log(this.dataHoje)
        });
     
      this.atualizarTempo();
  
      this.timerSub = interval(1000).subscribe(() => {
        this.atualizarTempo();
      });
    }  
    fecharLogin() {
    this.mostrarModal = false;
  }
  abrirLogin() {
    this.mostrarModal = true;
  }
    ngOnDestroy(): void {
      this.timerSub?.unsubscribe();
    }
    constructor(private router: Router, private session: SessionService, private usuarioService: UsuarioService, private authService: AuthServiceService){

  }
  goToDesafioHumanas(){
    this.router.navigate(['/desafio', 'humanas']);
  }
  goToDesafioNaturezas(){
    this.router.navigate(['/desafio', 'naturezas']);
  }
  goToDesafioExatas(){
    this.router.navigate(['/desafio', 'exatas']);
  }
  goToDesafioLinguagens(){
    this.router.navigate(['/desafio', 'linguagens']);
  }
 
  atualizarTempo() {
    const agora = new Date();
    const amanha = new Date();

    amanha.setHours(24, 0, 0, 0);

    const diff = amanha.getTime() - agora.getTime();

    if (diff <= 0) {
      this.tempoRestante = '00:00:00';
      return;
    }

    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diff % (1000 * 60)) / 1000);

    this.tempoRestante = 
      `${this.pad(horas)}:${this.pad(minutos)}:${this.pad(segundos)}`;
  }

  pad(valor: number): string {
    return valor.toString().padStart(2, '0');
  }
}

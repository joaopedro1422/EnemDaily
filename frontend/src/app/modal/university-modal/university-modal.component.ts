import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { Usuario } from '../../models/usuario';
import { UsuarioGrupo } from '../../models/grupo';
import { AuthServiceService } from '../../services/auth-service.service';
import { GrupoService } from '../../services/grupo.service';
import { CampusComponent } from '../../shared/campus/campus.component';
import { Progresso, TOTAL_PECAS, progressoDeColega, progressoDoUsuario, totalDePecas } from '../../shared/campus/campus';

@Component({
  selector: 'app-university-modal',
  imports: [AvatarComponent, CommonModule, CampusComponent],
  templateUrl: './university-modal.component.html',
  styleUrl: './university-modal.component.css'
})
export class UniversityModalComponent implements OnInit, OnDestroy {
  isClosing = false;
  usuarioLogado: Usuario | null = null;
  usuarioExternoBoolean = false;
  usuarioLogadoIsAdm = false;
  progresso: Progresso = progressoDoUsuario(null);
  pecas = 0;
  readonly totalCampus = TOTAL_PECAS;
  @Input() idAdmin!: string | null;
  @Input() idGrupo!: string | null;
  @Input() usuarioExterno!: UsuarioGrupo | null;
  @Output() close = new EventEmitter<void>();
  private sub?: Subscription;

  constructor(private authService: AuthServiceService, private grupoService: GrupoService) {}

  ngOnInit() {
    this.sub = this.authService.usuario$.subscribe(usuario => {
      this.usuarioLogado = usuario;
      if (this.usuarioExterno) {
        this.usuarioExternoBoolean = true;
        this.usuarioLogadoIsAdm = this.idAdmin === usuario?.id;
        this.progresso = progressoDeColega(this.usuarioExterno);
      } else {
        this.progresso = progressoDoUsuario(usuario);
      }
      this.pecas = totalDePecas(this.progresso);
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  removeUsuario() {
    Swal.fire({
      title: 'Remover do grupo?',
      text: `Tem certeza que deseja remover ${this.usuarioExterno?.usuario}? O progresso dele no grupo será perdido.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#95a5a6',
      confirmButtonText: 'Sim, remover!',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      heightAuto: false
    }).then(result => {
      if (!result.isConfirmed) return;
      this.grupoService.removeUsuarioGrupo(this.idGrupo!, this.usuarioExterno!.id).subscribe({
        next: () => {
          this.solicitarFechamento();
          Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
            .fire({ icon: 'success', title: 'Usuário removido com sucesso!' });
        },
        error: err => console.log(err)
      });
    });
  }

  solicitarFechamento() {
    this.isClosing = true;
    setTimeout(() => this.close.emit(), 100);
  }
}

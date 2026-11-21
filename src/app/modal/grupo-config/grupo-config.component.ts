import { CarregandoComponent } from '../../shared/carregando/carregando.component';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Grupo, GrupoAtualizado } from '../../models/grupo';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GrupoService } from '../../services/grupo.service';
import { FirebaseServiceService } from '../../services/firebase-service.service';
import { AuthServiceService } from '../../services/auth-service.service';

@Component({
  selector: 'app-grupo-config',
  imports: [CommonModule, FormsModule, CarregandoComponent],
  templateUrl: './grupo-config.component.html',
  styleUrl: './grupo-config.component.css'
})
export class GrupoConfigComponent {
  @Output() close = new EventEmitter<void>();
   isClosing = false;
  img?: File  = undefined;
  previewUrl?= '';
  imgOriginal? = '';
  nomeGrupo ?= '';
  isVisible? : boolean;
  loading = false;
   @Input() grupo!: Grupo | null;
   @Input() usuarioDemo?: boolean;
  fecharVoid(){
    this.isClosing = true;
    setTimeout(() => {
      this.close.emit(); 
    }, 600); 
  }
  ngOnInit(){
    this.previewUrl = this.grupo?.img;
    this.nomeGrupo = this.grupo?.nome;
    this.isVisible= this.grupo?.admVisivel;
    this.imgOriginal = this.grupo?.img;
  }
  onToggleRanking(event: any) {
    if(this.usuarioDemo){
      return;
    }
  this.isVisible = event.target.checked;
  
    
  }
  constructor(private grupoService: GrupoService, private firebaseService: FirebaseServiceService, private authService: AuthServiceService){}
 async salvar(){
  this.loading = true;
  if(this.usuarioDemo){
    this.fecharVoid();
    setTimeout(() => {
          this.authService.open();
        }, 1000); 
    return;
  }
  if(!this.grupo) return;
  if(!this.previewUrl) return;
  if(!this.nomeGrupo) return;
  let ret = '';
  if(this.imgOriginal !== this.previewUrl){
    ret = await this.firebaseService.salvaImagem(this.img!, this.nomeGrupo) ;
   
  }
  else{
    ret = this.imgOriginal;
  }
  
  const grupo: GrupoAtualizado = {id: this.grupo?.id, img: ret, admVisivel: this.isVisible!, nome: this.nomeGrupo}
  this.grupoService.atualizaGrupo(grupo).subscribe({
    next: (res) =>{
       setTimeout(() => {
          this.loading= false;
        }, 300); 
      this.fecharVoid();
    }, error: (err)=>{
      console.log(err);
    }
  })
  
}
  async onFileSelected(event : Event){
    console.log('aqui foi em')
    const file = (event.target as HTMLInputElement).files?.[0];
    if(!file) return 
    this.img = file;
    this.previewUrl = URL.createObjectURL(file);
  }
}

import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-recupera-senha',
  imports: [],
  templateUrl: './recupera-senha.component.html',
  styleUrl: './recupera-senha.component.css'
})
export class RecuperaSenhaComponent {
   @Output() close = new EventEmitter<void>();
}

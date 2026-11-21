import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-banner-inicial',
  imports: [CommonModule],
  templateUrl: './banner-inicial.component.html',
  styleUrl: './banner-inicial.component.css'
})
export class BannerInicialComponent {
  isClosing = false;
  
 @Output() close = new EventEmitter<void>();
   solicitarFechamento() {
    this.isClosing = true;

    setTimeout(() => {
      this.close.emit();
    }, 500);
  }
}

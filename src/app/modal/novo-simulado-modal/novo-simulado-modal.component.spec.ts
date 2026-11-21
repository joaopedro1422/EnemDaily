import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovoSimuladoModalComponent } from './novo-simulado-modal.component';

describe('NovoSimuladoModalComponent', () => {
  let component: NovoSimuladoModalComponent;
  let fixture: ComponentFixture<NovoSimuladoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovoSimuladoModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NovoSimuladoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatorioSemanalModalComponent } from './relatorio-semanal-modal.component';

describe('RelatorioSemanalModalComponent', () => {
  let component: RelatorioSemanalModalComponent;
  let fixture: ComponentFixture<RelatorioSemanalModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatorioSemanalModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelatorioSemanalModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

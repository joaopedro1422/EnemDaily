import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatorioSemanalFabComponent } from './relatorio-semanal-fab.component';

describe('RelatorioSemanalFabComponent', () => {
  let component: RelatorioSemanalFabComponent;
  let fixture: ComponentFixture<RelatorioSemanalFabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatorioSemanalFabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelatorioSemanalFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

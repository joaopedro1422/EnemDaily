import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstatisticasPageComponent } from './estatisticas-page.component';

describe('EstatisticasPageComponent', () => {
  let component: EstatisticasPageComponent;
  let fixture: ComponentFixture<EstatisticasPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstatisticasPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstatisticasPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodioMensalComponent } from './podio-mensal.component';

describe('PodioMensalComponent', () => {
  let component: PodioMensalComponent;
  let fixture: ComponentFixture<PodioMensalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PodioMensalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PodioMensalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

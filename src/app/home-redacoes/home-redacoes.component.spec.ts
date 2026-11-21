import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeRedacoesComponent } from './home-redacoes.component';

describe('HomeRedacoesComponent', () => {
  let component: HomeRedacoesComponent;
  let fixture: ComponentFixture<HomeRedacoesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeRedacoesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeRedacoesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

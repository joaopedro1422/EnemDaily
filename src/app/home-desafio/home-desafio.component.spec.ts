import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeDesafioComponent } from './home-desafio.component';

describe('HomeDesafioComponent', () => {
  let component: HomeDesafioComponent;
  let fixture: ComponentFixture<HomeDesafioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeDesafioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeDesafioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

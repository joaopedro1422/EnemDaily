import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeSimuladosComponent } from './home-simulados.component';

describe('HomeSimuladosComponent', () => {
  let component: HomeSimuladosComponent;
  let fixture: ComponentFixture<HomeSimuladosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeSimuladosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeSimuladosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

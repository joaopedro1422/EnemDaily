import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StreakSemanalComponent } from './streak-semanal.component';

describe('StreakSemanalComponent', () => {
  let component: StreakSemanalComponent;
  let fixture: ComponentFixture<StreakSemanalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StreakSemanalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StreakSemanalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

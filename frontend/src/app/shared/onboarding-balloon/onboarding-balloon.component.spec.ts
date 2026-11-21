import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnboardingBalloonComponent } from './onboarding-balloon.component';

describe('OnboardingBalloonComponent', () => {
  let component: OnboardingBalloonComponent;
  let fixture: ComponentFixture<OnboardingBalloonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingBalloonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OnboardingBalloonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

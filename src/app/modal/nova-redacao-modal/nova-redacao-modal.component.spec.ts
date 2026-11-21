import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovaRedacaoModalComponent } from './nova-redacao-modal.component';

describe('NovaRedacaoModalComponent', () => {
  let component: NovaRedacaoModalComponent;
  let fixture: ComponentFixture<NovaRedacaoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovaRedacaoModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NovaRedacaoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

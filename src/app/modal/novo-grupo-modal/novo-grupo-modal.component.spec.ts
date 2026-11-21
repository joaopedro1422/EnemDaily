import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovoGrupoModalComponent } from './novo-grupo-modal.component';

describe('NovoGrupoModalComponent', () => {
  let component: NovoGrupoModalComponent;
  let fixture: ComponentFixture<NovoGrupoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovoGrupoModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NovoGrupoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrupoConfigComponent } from './grupo-config.component';

describe('GrupoConfigComponent', () => {
  let component: GrupoConfigComponent;
  let fixture: ComponentFixture<GrupoConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrupoConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrupoConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

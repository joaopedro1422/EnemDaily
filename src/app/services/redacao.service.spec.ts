import { TestBed } from '@angular/core/testing';

import { RedacaoService } from './redacao.service';

describe('RedacaoService', () => {
  let service: RedacaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RedacaoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

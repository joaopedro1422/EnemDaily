import { TestBed } from '@angular/core/testing';

import { QuestaoServiceService } from './questao-service.service';

describe('QuestaoServiceService', () => {
  let service: QuestaoServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuestaoServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

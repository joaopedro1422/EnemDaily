import { TestBed } from '@angular/core/testing';

import { RankingStoreServiceService } from './ranking-store-service.service';

describe('RankingStoreServiceService', () => {
  let service: RankingStoreServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RankingStoreServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

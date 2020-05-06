import { TestBed } from '@angular/core/testing';

import { NgUmariDatafilterService } from './ng-umari-datafilter.service';

describe('NgUmariDatafilterService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NgUmariDatafilterService = TestBed.get(NgUmariDatafilterService);
    expect(service).toBeTruthy();
  });
});

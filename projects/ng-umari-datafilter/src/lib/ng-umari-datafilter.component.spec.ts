import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgUmariDatafilterComponent } from './ng-umari-datafilter.component';

describe('NgUmariDatafilterComponent', () => {
  let component: NgUmariDatafilterComponent;
  let fixture: ComponentFixture<NgUmariDatafilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgUmariDatafilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgUmariDatafilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

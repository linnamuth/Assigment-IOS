import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdvisorPage } from './advisor.page';

describe('AdvisorPage', () => {
  let component: AdvisorPage;
  let fixture: ComponentFixture<AdvisorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdvisorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

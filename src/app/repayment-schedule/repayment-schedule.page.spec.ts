import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RepaymentSchedulePage } from './repayment-schedule.page';

describe('RepaymentSchedulePage', () => {
  let component: RepaymentSchedulePage;
  let fixture: ComponentFixture<RepaymentSchedulePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RepaymentSchedulePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

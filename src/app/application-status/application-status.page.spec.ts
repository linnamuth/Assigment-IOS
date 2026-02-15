import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationStatusPage } from './application-status.page';

describe('ApplicationStatusPage', () => {
  let component: ApplicationStatusPage;
  let fixture: ComponentFixture<ApplicationStatusPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationStatusPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

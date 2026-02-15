import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-application-status',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './application-status.page.html',
  styleUrls: ['./application-status.page.scss']
})
export class ApplicationStatusPage implements OnInit {

  applicationId: string = '';
  submissionDate: string = '';
  reviewTime: string = '';
  applicantName: string = '';

  loanAmount: number = 0;
  loanInterest: number = 0;
  loanDuration: number = 0;
  loanCollateral: string = '';
  includeExtraFees: boolean = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // 1. Try to get state from navigation
    const navState = this.router.getCurrentNavigation()?.extras.state as any;

    if (navState?.application) {
      this.setApplication(navState.application);
    } else {
      // 2. If page is refreshed, try to load from localStorage
      const savedApp = localStorage.getItem('currentApplication');
      if (savedApp) {
        this.setApplication(JSON.parse(savedApp));
      } else {
        // 3. If no data, redirect back to form
        this.router.navigate(['/tabs/upload-document']);
      }
    }
  }

  private setApplication(app: any) {
    this.applicationId = app.id;
    this.submissionDate = app.submissionDate;
    this.reviewTime = app.reviewTime;
    this.applicantName = app.fullName;

    // Assign loan fields correctly
    this.loanAmount = app.loan?.amount || 0;
    this.loanInterest = app.loan?.interest || 0;
    this.loanDuration = app.loan?.duration || 0;
    this.loanCollateral = app.loan?.collateral || '';
    this.includeExtraFees = app.loan?.includeExtraFees || false;

    // Save to localStorage so page reload keeps data
    localStorage.setItem('currentApplication', JSON.stringify(app));
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  viewApplicationDetail() {
    this.router.navigate(['/application-detail'], { state: { applicationId: this.applicationId } });
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
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

  constructor(private router: Router, private navCtrl: NavController) {}

  ngOnInit() {
    // 1. Try to get state from the immediate router navigation
    const navState = this.router.getCurrentNavigation()?.extras.state as any;

    if (navState?.application) {
      this.setApplication(navState.application);
    } else {
      // 2. FALLBACK: Try to load from sessionStorage (handles Page Refresh)
      const savedApp = sessionStorage.getItem('currentApplication');

      if (savedApp) {
        this.setApplication(JSON.parse(savedApp));
      } else {
        // 3. SECONDARY FALLBACK: Check inside the active user object
        const userData = sessionStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;

        if (user && user.currentApplication) {
          this.setApplication(user.currentApplication);
        } else {
          // 4. If absolutely no data, go back to start
          console.warn('No application found in session. Redirecting...');
          this.navCtrl.navigateRoot('/tabs/home');
        }
      }
    }
  }

  private setApplication(app: any) {
    // Basic fields
    this.applicationId = app.id || app.applicationId;
    this.submissionDate = app.submissionDate;
    this.reviewTime = app.reviewTime;
    this.applicantName = app.fullName || (app.personalInfo ? app.personalInfo.fullName : '');

    // Loan fields (nested inside app.loan or app.loanDetails)
    const loan = app.loan || app.loanDetails;

    this.loanAmount = loan?.amount || 0;
    this.loanInterest = loan?.interest || 0;
    this.loanDuration = loan?.duration || 0;
    this.loanCollateral = loan?.collateral || '';
    this.includeExtraFees = loan?.includeExtraFees || false;

    // Persist to sessionStorage so it survives a browser refresh
    sessionStorage.setItem('currentApplication', JSON.stringify(app));
  }

  goToDashboard() {
    this.navCtrl.navigateRoot('/tabs/home');
  }

  viewApplicationDetail() {
    this.router.navigate(['/application-detail'], {
      state: { applicationId: this.applicationId }
    });
  }
}

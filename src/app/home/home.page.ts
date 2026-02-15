import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calculatorOutline, helpCircleOutline, settingsOutline, timeOutline } from 'ionicons/icons';
import { LoadingController, AlertController } from '@ionic/angular';

interface Calculation {
  title: string;
  duration: string;
  rate: string;
  amount: string;
  date: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonInput,
  ]
})
export class HomePage implements OnInit {

  // Form Data
  loanAmount: number = 0;
  interestRate: number = 0;
  durationMonths: number = 12;
  includeExtraFees: boolean = false;

  // Results
  monthlyPayment: number = 0;
  totalInterest: number = 0;
  totalPayback: number = 0;
  extraFees: number = 0;

  // History
  recentCalculations: Calculation[] = [];

  private readonly EXTRA_FEE = 25;
  private readonly CURRENCY_FORMAT = 'en-US';
  private _hasActiveLoan: boolean = false;
rateLabel: string = '';

constructor(private router: Router, private loadingCtrl: LoadingController, private alertCtrl: AlertController, private auth: AuthService) {
    addIcons({
      'help-circle-outline': helpCircleOutline,
      'calculator-outline': calculatorOutline,
      'time-outline': timeOutline,
      'settings-outline': settingsOutline
    });
  }
ionViewWillEnter() {
    this.checkActiveLoanStatus();
  }
  checkActiveLoanStatus() {
    const storedApp = localStorage.getItem('currentApplication');
    if (storedApp) {
      const app = JSON.parse(storedApp);

      // If there is an app and it has a months array
      if (app.months && app.months.length > 0) {
        const hasUnpaid = app.months.some((m: any) => m.paid === false);
        this._hasActiveLoan = hasUnpaid;
      } else {
        this._hasActiveLoan = true;
      }
    } else {
      this._hasActiveLoan = false;
    }
  }
  get hasActiveLoan(): boolean {
  const activeUser = JSON.parse(localStorage.getItem('user') || '{}');

  if (!activeUser || !activeUser.currentLoan) return false;

  if (activeUser.repaymentSchedule) {
    const hasUnpaidMonths = activeUser.repaymentSchedule.some((m: any) => !m.paid);
    return hasUnpaidMonths;
  }

  return true;
}

  set hasActiveLoan(value: boolean) {
    this._hasActiveLoan = value;
  }
  ngOnInit() {
    this.setWingRate();
  }
  setWingRate() {
  const wingRate = this.getRate(this.durationMonths);
  this.interestRate = wingRate.rate;
  this.rateLabel = wingRate.label;
}

async calculateLoan(): Promise<void> {

  if (!this.isValidInput()) {
    this.resetResults();
    return;
  }

  const loading = await this.loadingCtrl.create({
    message: 'Calculating...',
    spinner: 'circles',
    backdropDismiss: false
  });

  await loading.present();

  setTimeout(() => {

    const principal = Number(this.loanAmount);
    const annualRate = Number(this.interestRate);
    const months = Number(this.durationMonths);
    const monthlyRate = (annualRate / 100) / 12;
    const emi = this.calculateMonthlyPayment(principal, monthlyRate, months);
    this.extraFees = this.includeExtraFees ? this.EXTRA_FEE : 0;
    this.monthlyPayment = emi + this.extraFees;
    const totalWithoutFees = emi * months;

    this.totalInterest = totalWithoutFees - principal;
    this.totalPayback = totalWithoutFees + (this.extraFees * months);
    loading.dismiss();

  }, 500);
}



  private calculateMonthlyPayment(principal: number, monthlyRate: number, months: number): number {
    if (monthlyRate === 0) return principal / months;
    const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, months);
    const denominator = Math.pow(1 + monthlyRate, months) - 1;
    return numerator / denominator;
  }


private addToHistory() {
  const historyData = localStorage.getItem('loan_history');
  let history = historyData ? JSON.parse(historyData) : [];

  const newCalc = {
    amount: this.loanAmount,
    monthly: this.monthlyPayment,
    interestRate: this.interestRate,
    duration: this.durationMonths,
    timestamp: new Date().getTime(), // Vital for grouping
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  history.unshift(newCalc); // Newest at the top
  if (history.length > 20) history.pop(); // Keep last 20

  localStorage.setItem('loan_history', JSON.stringify(history));
}

  private getLoanType(amount: number): string {
    if (amount > 200000) return 'Mortgage Loan';
    if (amount > 20000) return 'Car Loan';
    if (amount > 5000) return 'Personal Loan';
    return 'Small Loan';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat(this.CURRENCY_FORMAT, { style: 'currency', currency: 'USD' }).format(value);
  }

  private isValidInput(): boolean {
    return this.loanAmount > 0 && this.interestRate >= 0 && this.durationMonths > 0;
  }

  private resetResults(): void {
    this.monthlyPayment = 0;
    this.totalInterest = 0;
    this.totalPayback = 0;
    this.extraFees = 0;
  }
async applyNow() {
  if (!this.isValidInput()) return;
  if (this.hasActiveLoan) {
    this.showBlockedAlert();
    return;
  }

  const loading = await this.loadingCtrl.create({
    message: 'Processing Application...',
    spinner: 'circles',
  });
  await loading.present();

  // 1. Prepare Loan Data
  const loanData = {
    amount: this.loanAmount,
    interest: this.interestRate,
    duration: this.durationMonths,
    monthlyPayment: this.monthlyPayment,
    totalPayback: this.totalPayback,
    status: 'Pending Documents',
    date: new Date().toISOString(),
    id: 'LOAN-' + Math.random().toString(36).substr(2, 9).toUpperCase() // Unique ID
  };

  // 2. Get the Current Active User
  const activeUserJson = localStorage.getItem('user');

  if (activeUserJson) {
    const currentUser = JSON.parse(activeUserJson);

    // Attach loan to the current session object
    currentUser.currentLoan = loanData;

    // Add to history if not already there
    if (!currentUser.loanHistory) currentUser.loanHistory = [];
    currentUser.loanHistory.unshift(loanData);

    // 3. Update the Active Session Key
    localStorage.setItem('user', JSON.stringify(currentUser));

    // 4. PERSISTENCE: Save back to the All Users list (so it stays after logout)
    const allUsersJson = localStorage.getItem('all_users_list');
    if (allUsersJson) {
      let users = JSON.parse(allUsersJson);
      // Find this specific user by username/email and update their record
      const index = users.findIndex((u: any) => u.username === currentUser.username);
      if (index !== -1) {
        users[index] = currentUser;
        localStorage.setItem('all_users_list', JSON.stringify(users));
      }
    }

    // 5. Update UI state
    this.auth.setUser(currentUser);
  }

  // 6. Navigate
  setTimeout(async () => {
    await loading.dismiss();
    this.router.navigate(['/tabs/upload-document']);
  }, 1500);
}
async showBlockedAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Action Restricted',
      subHeader: 'Outstanding Balance',
      message: 'Please complete your existing loan payments before performing new calculations.',
      buttons: [{
        text: 'View Schedule',
        handler: () => { this.router.navigate(['/tabs/repayment-schedule']); }
      }, 'Dismiss']
    });
    await alert.present();
  }
// Wing Bank interest rate based on duration (months)
getRate(months: number) {
  if (months <= 6) {
    return { label: 'Up to 6 months', rate: 1.5 };  // short-term loan, lower rate
  }
  if (months <= 12) {
    return { label: '7 – 12 months', rate: 2.0 };
  }
  if (months <= 24) {
    return { label: '13 – 24 months', rate: 2.5 };
  }
  if (months <= 36) {
    return { label: '25 – 36 months', rate: 3.0 };
  }
  return { label: 'Above 36 months', rate: 3.5 };   // long-term loans slightly higher
}

onDurationChange() {
  // Ensure duration is treated as a number
  const months = Number(this.durationMonths);

  const wingRate = this.getRate(months);

  this.interestRate = wingRate.rate;
  this.rateLabel = wingRate.label;

}



}

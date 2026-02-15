import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonInput,
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
  standalone: true, // Ensure standalone is true if using imports
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

  private readonly EXTRA_FEE = 25;
  private readonly CURRENCY_FORMAT = 'en-US';
  private _hasActiveLoan: boolean = false;
  rateLabel: string = '';

  constructor(
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private auth: AuthService
  ) {
    addIcons({
      'help-circle-outline': helpCircleOutline,
      'calculator-outline': calculatorOutline,
      'time-outline': timeOutline,
      'settings-outline': settingsOutline
    });
  }

  ngOnInit() {
    this.setWingRate();
  }

  ionViewWillEnter() {
    this.checkActiveLoanStatus();
  }

  /**
   * Check if user has an unpaid loan in the current session
   */
  checkActiveLoanStatus() {
    const sessionUser = sessionStorage.getItem('user');
    if (sessionUser) {
      const user = JSON.parse(sessionUser);

      // Check if currentLoan exists and if there are unpaid months in the schedule
      if (user.currentLoan) {
        if (user.repaymentSchedule && user.repaymentSchedule.length > 0) {
          const hasUnpaid = user.repaymentSchedule.some((m: any) => m.paid === false);
          this._hasActiveLoan = hasUnpaid;
        } else {
          this._hasActiveLoan = true; // Loan exists but no schedule generated yet
        }
      } else {
        this._hasActiveLoan = false;
      }
    }
  }

  get hasActiveLoan(): boolean {
    const activeUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (!activeUser || !activeUser.currentLoan) return false;

    if (activeUser.repaymentSchedule && activeUser.repaymentSchedule.length > 0) {
      return activeUser.repaymentSchedule.some((m: any) => !m.paid);
    }
    return true;
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
      mode: 'ios'
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

      this.addToHistory(); // Save calculation to history
      loading.dismiss();
    }, 500);
  }

  private calculateMonthlyPayment(principal: number, monthlyRate: number, months: number): number {
    if (monthlyRate === 0) return principal / months;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  }

  private addToHistory() {
    const historyData = sessionStorage.getItem('loan_history');
    let history = historyData ? JSON.parse(historyData) : [];

    const newCalc = {
      amount: this.loanAmount,
      monthly: this.monthlyPayment,
      interestRate: this.interestRate,
      duration: this.durationMonths,
      timestamp: new Date().getTime(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    history.unshift(newCalc);
    if (history.length > 20) history.pop();

    sessionStorage.setItem('loan_history', JSON.stringify(history));
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
      mode: 'ios'
    });
    await loading.present();

    const loanData = {
      amount: this.loanAmount,
      interest: this.interestRate,
      duration: this.durationMonths,
      monthlyPayment: this.monthlyPayment,
      totalPayback: this.totalPayback,
      status: 'Pending Documents',
      date: new Date().toISOString(),
      id: 'LOAN-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    };

    // Use sessionStorage
    const activeUserJson = sessionStorage.getItem('user');

    if (activeUserJson) {
      const currentUser = JSON.parse(activeUserJson);
      currentUser.currentLoan = loanData;

      if (!currentUser.loanHistory) currentUser.loanHistory = [];
      currentUser.loanHistory.unshift(loanData);

      // Update current user session
      sessionStorage.setItem('user', JSON.stringify(currentUser));

      // Sync with global session user list
      const allUsersJson = sessionStorage.getItem('all_users_list');
      if (allUsersJson) {
        let users = JSON.parse(allUsersJson);
        const index = users.findIndex((u: any) => u.username === currentUser.username);
        if (index !== -1) {
          users[index] = currentUser;
          sessionStorage.setItem('all_users_list', JSON.stringify(users));
        }
      }

      this.auth.setUser(currentUser);
    }

    setTimeout(async () => {
      await loading.dismiss();
      this.router.navigate(['/tabs/upload-document']);
    }, 1500);
  }

  async showBlockedAlert() {
    const alert = await this.alertCtrl.create({
      header: 'Action Restricted',
      subHeader: 'Outstanding Balance',
      message: 'Please complete your existing loan payments before applying for a new one.',
      mode: 'ios',
      buttons: [{
        text: 'View Schedule',
        handler: () => { this.router.navigate(['/tabs/repayment-schedule']); }
      }, 'Dismiss']
    });
    await alert.present();
  }

  getRate(months: number) {
    if (months <= 6) return { label: 'Up to 6 months', rate: 1.5 };
    if (months <= 12) return { label: '7 – 12 months', rate: 2.0 };
    if (months <= 24) return { label: '13 – 24 months', rate: 2.5 };
    if (months <= 36) return { label: '25 – 36 months', rate: 3.0 };
    return { label: 'Above 36 months', rate: 3.5 };
  }

  onDurationChange() {
    const months = Number(this.durationMonths);
    const wingRate = this.getRate(months);
    this.interestRate = wingRate.rate;
    this.rateLabel = wingRate.label;
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
}

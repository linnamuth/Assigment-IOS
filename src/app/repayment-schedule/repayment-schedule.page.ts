import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { IonContent, IonProgressBar, IonButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { checkmarkCircle, cashOutline, calendarOutline, calendarNumberOutline, pricetag } from 'ionicons/icons';
import { DecimalPipe, CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-repayment-schedule',
  standalone: true,
  imports: [IonContent, IonProgressBar, IonButton, IonIcon, DecimalPipe, CommonModule],
  templateUrl: './repayment-schedule.page.html',
  styleUrls: ['./repayment-schedule.page.scss']
})
export class RepaymentSchedulePage implements OnInit {
  loanAmount: number = 0;
  monthlyPayment: number = 0;
  durationMonths: number = 0;
  interestRate: number = 0;
  totalInterestPaid: number = 0;
  startDate: Date = new Date();

  months: { number: number; name: string; amount: string; paid: boolean; locked: boolean; fullDate: string }[] = [];
  currentYear: number = new Date().getFullYear();

  private dateFormatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  checkmarkCircle = checkmarkCircle;

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    addIcons({ cashOutline, calendarOutline, calendarNumberOutline, checkmarkCircle, pricetag });
  }

  ngOnInit() {
    this.loadLoanData();
  }
    ionViewWillEnter() {
      this.loadLoanData();
    }


 loadLoanData() {
  const sessionData = sessionStorage.getItem('active_user');
  const currentUser = JSON.parse(sessionData || '{}');

  if (!currentUser) {
    this.months = [];
    this.presentToast('No user data found.', 'warning');
    return;
  }

  // Try current loan first
  let loan: any = currentUser.currentLoan;

  // If no current loan, check loanHistory
  if (!loan && currentUser.loanHistory && currentUser.loanHistory.length > 0) {
    loan = currentUser.loanHistory[0]; // most recent loan
    this.presentToast('Displaying your completed loan schedule.', 'success');
  }

  // If still no loan, allow user to generate a schedule
  if (!loan) {
    this.months = [];
    return; // Do NOT navigate away, let user click "Generate Schedule"
  }

  // Load loan data
  this.loanAmount = loan.amount || 0;
  this.durationMonths = loan.duration || 12;
  this.interestRate = loan.interest || 0;
  this.monthlyPayment = loan.monthly || (this.loanAmount / this.durationMonths);

  // Load repayment schedule
  if (currentUser.repaymentSchedule && currentUser.repaymentSchedule.length > 0) {
    this.months = currentUser.repaymentSchedule.map((m: any) => ({
      ...m,
      locked: m.paid === true
    }));
  } else {
    // If loan completed, mark all months as paid
    const isCompleted = loan.status === 'Completed';
    this.generateMonths(isCompleted);
  }
}


  generateMonths(isCompleted: boolean = false) {
    const loanDate = new Date();

    this.months = Array.from({ length: this.durationMonths }, (_, i) => {
      const paymentDate = new Date(loanDate);
      paymentDate.setMonth(loanDate.getMonth() + (i + 1));

      const day = String(paymentDate.getDate()).padStart(2, '0');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[paymentDate.getMonth()];
      const year = paymentDate.getFullYear();

      return {
        number: i + 1,
        name: month,
        fullDate: `${day} - ${month} - ${year}`,
        amount: `$${this.monthlyPayment.toFixed(2)}`,
        paid: isCompleted,
        locked: isCompleted
      };
    });
  }

  // Getters for Dynamic Display
  get payoffDate(): string {
    return this.months.length > 0 ? this.months[this.months.length - 1].fullDate : 'N/A';
  }

  get progressValue(): number {
    const paidCount = this.months.filter(m => m.paid).length;
    return this.months.length > 0 ? paidCount / this.months.length : 0;
  }

  get totalRepaid(): number {
    return this.months.filter(m => m.paid).length * this.monthlyPayment;
  }

  get remainingBalance(): number {
    return (this.monthlyPayment * this.durationMonths) - this.totalRepaid;
  }

  togglePayment(month: any, index: number) {
    if (month.locked) return;

    if (index > 0 && !this.months[index - 1].locked) {
      this.presentToast('Submit your previous payment before starting the next one.', 'warning');
      return;
    }

    const currentlyChecking = this.months.some(m => m.paid && !m.locked);
    if (!month.paid && currentlyChecking) {
      this.presentToast('Please submit your current selection first.', 'warning');
      return;
    }

    month.paid = !month.paid;
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, mode: 'ios' });
    await toast.present();
  }

  async saveSchedule() {
    const loading = await this.loadingCtrl.create({
      message: 'Updating session...',
      spinner: 'crescent',
      mode: 'ios'
    });
    await loading.present();

    this.months.forEach(m => { if (m.paid) m.locked = true; });

    // UPDATED: Saving to sessionStorage
    const userData = sessionStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      user.repaymentSchedule = [...this.months];

      if (!user.loanHistory) user.loanHistory = [];

      const historyEntry = {
        amount: this.loanAmount,
        monthly: this.monthlyPayment,
        timestamp: new Date().getTime(),
        status: this.progressValue === 1 ? 'Completed' : 'Active'
      };

      const alreadyExists = user.loanHistory.some((h: any) => h.timestamp === historyEntry.timestamp);
      if (!alreadyExists) {
        user.loanHistory.unshift(historyEntry);
      }

      // SAVE BACK TO SESSION
      sessionStorage.setItem('user', JSON.stringify(user));
    }

    await loading.dismiss();
    this.presentToast('status updated!', 'success');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
}

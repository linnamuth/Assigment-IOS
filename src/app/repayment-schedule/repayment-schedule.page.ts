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
  // Loan info
  loanAmount: number = 0;
  monthlyPayment: number = 0;
  durationMonths: number = 0;
  interestRate: number = 0;
  totalInterestPaid: number = 0;
  startDate: Date = new Date(); // Defaults to today

  // Schedule
  months: { number: number; name: string; amount: string; paid: boolean; locked: boolean; fullDate: string }[] = [];
  currentYear: number = new Date().getFullYear();
  private dateFormatter = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  // Icons
  checkmarkCircle = checkmarkCircle;

  constructor(
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    // Register icons for the summary cards
    addIcons({ cashOutline, calendarOutline, calendarNumberOutline, checkmarkCircle, pricetag });
  }

  ngOnInit() {
    this.loadLoanData();
  }
ionViewWillEnter() {
    console.log('Page is active - refreshing data');
    this.loadLoanData();
  }
 loadLoanData() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  if (!currentUser || !currentUser.currentLoan) {
    this.router.navigate(['/tabs/home']);
    return;
  }
  const loan = currentUser.currentLoan;
  this.loanAmount = loan.amount || 0;
  this.durationMonths = loan.duration || 12;
  this.interestRate = loan.interest || 0;
  this.monthlyPayment = loan.monthlyPayment || (this.loanAmount / this.durationMonths);

  // 3. Check if this specific user has a saved schedule
  if (currentUser.repaymentSchedule && currentUser.repaymentSchedule.length > 0) {
    this.months = currentUser.repaymentSchedule.map((m: any) => ({
      ...m,
      locked: m.paid === true
    }));
  } else {
    this.generateMonths();
  }
}

 generateMonths() {
  const loanDate = new Date(); // This is "Today"

  this.months = Array.from({ length: this.durationMonths }, (_, i) => {
    const paymentDate = new Date(loanDate);

    // Set to the same day of the month, but i + 1 months in the future
    paymentDate.setMonth(loanDate.getMonth() + (i + 1));

    // Manual format to D - M - Y
    const day = String(paymentDate.getDate()).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[paymentDate.getMonth()];
    const year = paymentDate.getFullYear();

    return {
      number: i + 1,
      name: month,
      fullDate: `${day} - ${month} - ${year}`, // Result: 15 - Feb - 2026
      amount: `$${this.monthlyPayment.toFixed(2)}`,
      paid: false,
      locked: false
    };
  });
}

 get payoffDate(): string {
  if (this.months.length > 0) {
    return this.months[this.months.length - 1].fullDate;
  }
  return 'N/A';
}

  get progressValue(): number {
    const paidCount = this.months.filter(m => m.paid).length;
    return this.months.length > 0 ? paidCount / this.months.length : 0;
  }

  get totalRepaid(): number {
    return this.months.filter(m => m.paid).length * this.monthlyPayment;
  }

  get remainingBalance(): number {
    const totalToPay = this.monthlyPayment * this.durationMonths;
    return totalToPay - this.totalRepaid;
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
    const toast = await this.toastCtrl.create({ message, duration: 2000, color });
    await toast.present();
  }

 async saveSchedule() {
  const loading = await this.loadingCtrl.create({
    message: 'Updating your account...',
    spinner: 'crescent'
  });
  await loading.present();

  // Mark paid months as locked
  this.months.forEach(m => { if (m.paid) m.locked = true; });

  // 1. Get current user
  const userData = localStorage.getItem('user');
  if (userData) {
    const user = JSON.parse(userData);

    // 2. Save the schedule INSIDE the user object
    user.repaymentSchedule = [...this.months];

    // 3. Update their history inside the user object
    if (!user.loanHistory) user.loanHistory = [];

    const historyEntry = {
      amount: this.loanAmount,
      monthly: this.monthlyPayment,
      timestamp: new Date().getTime(),
      status: this.progressValue === 1 ? 'Completed' : 'Active'
    };

    // Check if this loan is already in history, if not, add it
    const alreadyExists = user.loanHistory.some((h:any) => h.timestamp === historyEntry.timestamp);
    if (!alreadyExists) {
      user.loanHistory.unshift(historyEntry);
    }

    // 4. Save the "Mega Object" back to LocalStorage
    localStorage.setItem('user', JSON.stringify(user));
  }

  await loading.dismiss();
  this.presentToast('Repayment status updated!', 'success');
}

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
}

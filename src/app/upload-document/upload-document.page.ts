import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { LoadingController, AlertController } from '@ionic/angular';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonProgressBar,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonButton
} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';

interface DocumentItem {
  id: number;
  title: string;
  description: string;
  icon: string;
  file?: File;
}

interface LoanData {
  collateral: string;
  includeExtraFees: boolean;
  amount: number;
  interest: number;
  duration: number;
}

@Component({
  selector: 'app-upload-document',
  templateUrl: './upload-document.page.html',
  styleUrls: ['./upload-document.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonProgressBar,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSelect,         // <-- add this
    IonSelectOption
  ]

})
export class UploadDocumentPage implements OnInit {

  // Applicant info
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  placeOfBirth: string = '';
  currentAddress: string = '';
  address = {
    province: '',
    district: '',
    commune: '',
    village: ''
  };
  provinces = '';
  districts = '';
  communes = '';

  province = '';
  district = '';
  commune = '';

  maritalStatuses: string[] = ['Single', 'Married', 'Divorced', 'Widowed'];
  occupations: string[] = ['Employee', 'Business Owner', 'Self-Employed', 'Unemployed', 'Student'];
  incomeSources: string[] = ['Salary', 'Business', 'Rental Income', 'Investments', 'Others'];
  // Personal Info
  maritalStatus: string = '';

  currentOccupation: string = '';

  sourceOfIncome: string = '';

  company: string = '';

  // Loan Info
  loanTypes: string[] = ['Personal Loan', 'Car Loan', 'Mortgage', 'Quick Loan'];
  loanType: string = '';

  loanPurposes: string[] = ['Home Renovation', 'Education', 'Vehicle Purchase', 'Business', 'Others'];
  loanPurpose: string = '';

  loanAmount: number = 0;
  interestRate: number = 0;
  durationMonths: number = 12;
  collateral: string = '';
  repaymentMethods: string[] = ['Monthly', 'Quarterly', 'Lump-sum'];
  repaymentMethod: string = '';
  disbursementDate: string = '';


  documents: DocumentItem[] = [
    { id: 1, title: 'ID Card / Passport', description: 'Upload your official ID', icon: 'document-text-outline' },
    { id: 2, title: 'Income Proof', description: 'Payslip or bank statement', icon: 'document-text-outline' },
  ];
  includeExtraFees: any;

  constructor(
    private router: Router,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.loadLoanFromSession();
  }

  loadLoanFromSession() {
    const sessionData = sessionStorage.getItem('user');

    if (sessionData) {
      const user = JSON.parse(sessionData);
      if (user.currentLoan) {
        const loan = user.currentLoan;

        this.loanAmount = loan.amount || 0;
        this.interestRate = loan.interest || 0;
        this.durationMonths = loan.duration || 12;
        this.collateral = loan.collateral || '';
        this.includeExtraFees = loan.includeExtraFees || false;

        console.log('Loan data loaded from session:', loan);
      } else {
        console.warn('No active loan calculation found in session.');
      }

      if (!this.firstName) this.firstName = user.username || '';
      if (!this.email) this.email = user.email || '';

    } else {
      console.error('Session lost. Redirecting...');
      this.router.navigate(['/tabs/home']);
    }
  }


  chooseFile(docId: number) {
    const input = document.querySelector<HTMLInputElement>(`input[data-id="${docId}"]`);
    input?.click();
  }

  onFileSelected(event: any, docId: number) {
    const file = event.target.files[0];
    if (file) {
      const doc = this.documents.find(d => d.id === docId);
      if (doc) doc.file = file;
    }
  }

  editLoan() {
    this.router.navigate(['/tabs/home']);
  }
  async submitApplication() {
    // Basic Validation


    const loading = await this.loadingCtrl.create({
      message: 'Submitting to Session...',
      spinner: 'circles',
      mode: 'ios'
    });
    await loading.present();

    try {
      const userData = sessionStorage.getItem('user');
      if (!userData) throw new Error("No User Session");

      const currentUser = JSON.parse(userData);
      const applicationData = {
        applicationId: '#LN-' + Math.floor(Math.random() * 1000000),
        status: 'Under Review',
        personalInfo: {
          email: this.email,
          address: `${this.currentAddress}, ${this.commune}, ${this.district}, ${this.province}`
        },
        loanDetails: currentUser.currentLoan, // Inherit from the calculation
        submissionDate: new Date().toISOString(),
        reviewTime: '24–48 Hours'
      };

      currentUser.currentApplication = applicationData;

      sessionStorage.setItem('user', JSON.stringify(currentUser));
      sessionStorage.setItem('currentApplication', JSON.stringify(applicationData));

      const allUsers = JSON.parse(sessionStorage.getItem('all_users_list') || '[]');
      const idx = allUsers.findIndex((u: any) => u.email === currentUser.email);
      if (idx !== -1) {
        allUsers[idx] = currentUser;
        sessionStorage.setItem('all_users_list', JSON.stringify(allUsers));
      }

      await loading.dismiss();

      // Navigate to status page
      this.router.navigate(['/tabs/application-status']);

    } catch (error) {
      await loading.dismiss();
      const errorAlert = await this.alertCtrl.create({
        header: 'Submission Error',
        message: 'Session lost. Please log in again.',
        buttons: ['OK'],
        mode: 'ios'
      });
      await errorAlert.present();
    }
  }




 saveLoanData() {
  const loanData = {
    loanType: this.loanType,
    amount: this.loanAmount,
    interest: this.interestRate,
    duration: this.durationMonths,
    collateral: this.collateral // Good to include this too
  };

  const sessionUser = sessionStorage.getItem('user');

  if (sessionUser) {
    const user = JSON.parse(sessionUser);
    user.currentLoan = loanData;
    sessionStorage.setItem('user', JSON.stringify(user));
  } else {
    sessionStorage.setItem('loanData', JSON.stringify(loanData));
  }
}

}

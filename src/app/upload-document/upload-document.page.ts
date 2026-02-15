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
  phoneNumber: string = '';
  placeOfBirth: string = '';
  currentAddress: string = '';
  address = {
    province: '',
    district: '',
    commune: '',
    village: ''
  };
  provinces = ['Phnom Penh', 'Siem Reap', 'Battambang'];
  districts = ['Chamkar Mon', 'Prampir Meakkakra', 'Daun Penh'];
  communes = ['Sangkat 1', 'Sangkat 2', 'Sangkat 3'];

  province = '';
  district = '';
  commune = '';

  // Dropdown options
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

  // ngModel bindings



  // Loan info passed from previous page
  // loan: LoanData = {
  //   amount: 0,
  //   interest: 0,
  //   duration: 0,
  //   collateral: '',
  //   includeExtraFees: false
  // };

  // List of required documents
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


    const storedLoan = localStorage.getItem('loanData');
    if (storedLoan) {
      const loan = JSON.parse(storedLoan);
      this.loanAmount = loan.amount;
      this.interestRate = loan.interest;
      this.durationMonths = loan.duration;
      this.collateral = loan.collateral;
      this.includeExtraFees = loan.includeExtraFees || false;
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
    // Navigate back to the previous page to edit loan details
    this.router.navigate(['/tabs/home']);
  }

  // In your form page (e.g., upload-document.page.ts)
async submitApplication() {

  const loading = await this.loadingCtrl.create({
    message: 'Processing...',
    spinner: 'circles',
    backdropDismiss: false
  });

  await loading.present();

  try {
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ✅ Get loan from localStorage
    const storedLoan = localStorage.getItem('loanData');

    let loanData = {
      amount: 0,
      interest: 0,
      duration: 0,
      collateral: '',
      includeExtraFees: false
    };

    if (storedLoan) {
      loanData = JSON.parse(storedLoan);
    }

    // ✅ Build application object
    const applicationData = {
      id: '#LN-' + Math.floor(Math.random() * 1000000),
      fullName: `${this.firstName} ${this.lastName}`,
      email: this.email,
      placeOfBirth: this.placeOfBirth,
      maritalStatus: this.maritalStatus || '',
      currentOccupation: this.currentOccupation || '',
      sourceOfIncome: this.sourceOfIncome || '',
      company: this.company || '',
      address: {
        province: this.province,
        district: this.district,
        commune: this.commune,
        current: this.currentAddress || ''
      },
      loan: loanData,
      submissionDate: new Date().toLocaleString(),
      reviewTime: '24–48 Hours'
    };

    // ✅ Save to localStorage
    localStorage.setItem('currentApplication', JSON.stringify(applicationData));

    await loading.dismiss();



     this.router.navigate(
            ['/tabs/application-status'],
            { state: { application: applicationData } }
          );

  } catch (error) {

    await loading.dismiss();

    const errorAlert = await this.alertCtrl.create({
      header: 'Error',
      message: 'Failed to submit application. Please try again.',
      buttons: ['OK']
    });

    await errorAlert.present();
  }
}




saveLoanData() {
    const loanData = {
      loanType: this.loanType,
      amount: this.loanAmount,
      interest: this.interestRate,
      duration: this.durationMonths
    };
    localStorage.setItem('loanData', JSON.stringify(loanData));
  }

}

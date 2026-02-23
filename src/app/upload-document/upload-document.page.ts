import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { LoadingController, AlertController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';

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
import { CapacitorHttp } from '@capacitor/core';
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

province: string = '';
district: string = '';
commune: string = '';


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
    this.getCurrentCoordinates();
  }

  loadLoanFromSession() {
  const sessionData = sessionStorage.getItem('active_user');

  if (sessionData) {
    const user = JSON.parse(sessionData);
    console.log('Active user loaded:', user);

    // Set default personal info
    this.firstName = user.username || '';
    this.email = user.email || '';

    // Load current loan if exists
    if (user.currentLoan) {
      const loan = user.currentLoan;
      this.loanAmount = loan.amount || 0;
      this.interestRate = loan.interest || 0;
      this.durationMonths = loan.duration || 12;
      this.collateral = loan.collateral || '';
      this.includeExtraFees = loan.includeExtraFees || false;
    }
  } else {
    console.warn('No active user found. Redirecting...');
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
  const loading = await this.loadingCtrl.create({
    message: 'Submitting Application...',
    spinner: 'circles',
    mode: 'ios'
  });
  await loading.present();

  try {
    // 1. Consistency: Use the same key you used in loadLoanFromSession
    const userData = sessionStorage.getItem('active_user');

    if (!userData) {
      throw new Error("No User Session Found");
    }

    const currentUser = JSON.parse(userData);

    // 2. Create the application object
    const applicationData = {
      applicationId: '#LN-' + Math.floor(Math.random() * 1000000),
      status: 'Under Review',
      personalInfo: {
        email: this.email,
        // Make sure these variables aren't empty
        address: `${this.currentAddress || ''} ${this.commune || ''}, ${this.district || ''}, ${this.province || ''}`.trim()
      },
      loanDetails: currentUser.currentLoan || {},
      submissionDate: new Date().toISOString(),
      reviewTime: '24–48 Hours'
    };

    // 3. Update the objects
    currentUser.currentApplication = applicationData;

    // 4. Save back to session storage
    sessionStorage.setItem('active_user', JSON.stringify(currentUser));
    sessionStorage.setItem('currentApplication', JSON.stringify(applicationData));

    // 5. Update the master list if it exists
    const allUsers = JSON.parse(sessionStorage.getItem('all_users_list') || '[]');
    const idx = allUsers.findIndex((u: any) => u.email === currentUser.email);
    if (idx !== -1) {
      allUsers[idx] = currentUser;
      sessionStorage.setItem('all_users_list', JSON.stringify(allUsers));
    }

    await loading.dismiss();
    this.router.navigate(['/tabs/application-status']);

  } catch (error) {
    await loading.dismiss();
    console.error("Submission Error Details:", error); // See the real error in console

    const errorAlert = await this.alertCtrl.create({
      header: 'Submission Error',
      message: 'Your session has expired or is invalid. Please log in again.',
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
 async getCurrentCoordinates() {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      await this.getAddressFromCoordinates(coordinates.coords.latitude, coordinates.coords.longitude);
    } catch (err) {
      console.error('Location error', err);
      this.currentAddress = 'Manual entry required';
    }
  }

async getAddressFromCoordinates(lat: number, lng: number) {
  try {
    const options = {
      url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      headers: { 'User-Agent': 'MyIonicApp/1.0' }
    };

    // This uses Native power to skip CORS entirely
    const response = await CapacitorHttp.get(options);
    const data = response.data;

    if (data && data.address) {
      this.province = data.address.state || data.address.province || '';
      this.district = data.address.city || data.address.town || '';
      this.commune = data.address.suburb || data.address.village || '';
      this.currentAddress = data.display_name || '';
    }
  } catch (error) {
    console.error('Even Native fetch failed:', error);
    this.setDefaultAddress(); // Fallback
  }
}
setDefaultAddress() {
  // Set these to your most common location or leave empty strings
  this.province = 'Phnom Penh';
  this.district = 'Chamkar Mon';
  this.commune = 'Tonle Bassac';
  this.currentAddress = 'Phnom Penh, Cambodia';
}

}

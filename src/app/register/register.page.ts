import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class RegisterPage {
  username: string = '';
  email: string = '';
  password: string = '';
  showPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async onRegister() {
  // ... (Keep your validation code) ...

  const loading = await this.loadingCtrl.create({
    message: 'Creating account...',
    mode: 'ios'
  });
  await loading.present();

  try {
    const newUser = {
      id: Date.now(),
      username: this.username.trim(),
      email: this.email.toLowerCase().trim(),
      password: this.password, // plain text for testing, but ideally hashed
      joinedDate: new Date().toISOString(),
      balance: 0,
      completedVideoIds: [],
      loanHistory: []
    };

    // 1. USE LOCALSTORAGE for the 'Database' (all_users_list)
    // This ensures the account exists even if the tab is closed/hosted
    const storedUsers = localStorage.getItem('all_users_list');
    let usersArray = storedUsers ? JSON.parse(storedUsers) : [];

    const userExists = usersArray.some((u: any) => u.email === newUser.email);
    if (userExists) {
      await loading.dismiss();
      this.presentToast('Email already registered', 'danger');
      return;
    }

    // Save to the "Permanent" list
    usersArray.push(newUser);
    localStorage.setItem('all_users_list', JSON.stringify(usersArray));

    // 2. USE SESSIONSTORAGE for the Active User only
    // This tells the app "this person is logged in right now"
    sessionStorage.setItem('user', JSON.stringify(newUser));

    this.auth.register(newUser);

    await loading.dismiss();
    this.router.navigate(['/tabs/home'], { replaceUrl: true });
    this.presentToast('Account created successfully!', 'success');

  } catch (error) {
    await loading.dismiss();
    this.presentToast('Storage error. Check browser settings.', 'danger');
  }
}

  async presentToast(message: string, color: string = 'dark') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom',
      mode: 'ios',
      color: color
    });
    await toast.present();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

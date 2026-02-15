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
  // ... (validation code remains the same) ...

  const loading = await this.loadingCtrl.create({
    message: 'Registering...'
  });
  await loading.present();

  try {
    const newUser = {
      id: Date.now(),
      username: this.username.trim(),
      email: this.email.toLowerCase().trim(),
      password: this.password, // Note: In a real app, never store plain text passwords!
      joinedDate: new Date().toISOString(),
      balance: 0,
      completedVideoIds: [],
      loanHistory: []
    };

    // 1. USE LOCALSTORAGE for the 'Database' so it survives a browser close
    const storedUsers = localStorage.getItem('all_users_list');
    let usersArray = storedUsers ? JSON.parse(storedUsers) : [];

    // 2. Check if user exists
    const userExists = usersArray.some((u: any) => u.email === newUser.email);
    if (userExists) {
      await loading.dismiss();
      this.presentToast('Email already registered', 'danger');
      return;
    }

    // 3. Save to Permanent User List
    usersArray.push(newUser);
    localStorage.setItem('all_users_list', JSON.stringify(usersArray));

    // 4. USE SESSIONSTORAGE for the Active Login (security)
    sessionStorage.setItem('user', JSON.stringify(newUser));

    // 5. Update Auth Service
    this.auth.setUser(newUser);

    await loading.dismiss();
    this.router.navigate(['/tabs/home'], { replaceUrl: true });
    this.presentToast('Registration successful!', 'success');

  } catch (error) {
    await loading.dismiss();
    this.presentToast('Storage error.', 'danger');
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

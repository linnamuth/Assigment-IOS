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
    if (!this.username.trim() || !this.email.trim() || !this.password.trim()) {
      this.presentToast('Please fill in all fields', 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.presentToast('Please enter a valid email address', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Creating temporary account...',
      mode: 'ios'
    });
    await loading.present();

    try {
      const newUser = {
        id: Date.now(),
        username: this.username.trim(),
        email: this.email.toLowerCase().trim(),
        password: this.password,
        joinedDate: new Date().toISOString(),
        profilePic: null,
        balance: 0,
        currentLoan: null,
        repaymentSchedule: [],
        loanHistory: []
      };

      await Haptics.impact({ style: ImpactStyle.Medium });

      // 3. DATABASE LOGIC: Using sessionStorage instead of localStorage
      const storedUsers = sessionStorage.getItem('all_users_list');
      let usersArray = storedUsers ? JSON.parse(storedUsers) : [];

      // 4. CHECK IF EMAIL EXISTS IN THIS SESSION
      const userExists = usersArray.some((u: any) => u.email === newUser.email);
      if (userExists) {
        loading.dismiss();
        this.presentToast('Email already exists in this session', 'danger');
        return;
      }

      // 5. SAVE TO GLOBAL LIST (SESSION ONLY)
      usersArray.push(newUser);
      sessionStorage.setItem('all_users_list', JSON.stringify(usersArray));

      // 6. SET CURRENT SESSION
      sessionStorage.setItem('user', JSON.stringify(newUser));

      // Update AuthService state
      this.auth.register(newUser);

      loading.dismiss();

      // 7. NAVIGATE
      setTimeout(() => {
        this.router.navigate(['/tabs/home'], { replaceUrl: true });
        this.presentToast('Registration successful!', 'success');
      }, 300);

    } catch (error) {
      loading.dismiss();
      console.error('Registration Error:', error);
      this.presentToast('Session storage error.', 'danger');
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

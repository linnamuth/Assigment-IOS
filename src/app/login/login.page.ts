import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LoginPage {
  identity: string = ''; // Username or Email
  password: string = '';
  showPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async onLogin() {
    // 1. Validation
    if (!this.identity.trim() || !this.password.trim()) {
      this.presentToast('Please enter your credentials', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Authenticating...',
      mode: 'ios'
    });
    await loading.present();

    try {
      // 2. SEARCH IN SESSION STORAGE
      const allUsersData = sessionStorage.getItem('all_users_list');
      const inputIdentity = this.identity.toLowerCase().trim();

      if (allUsersData) {
        const users = JSON.parse(allUsersData);

        // Find user where email or username matches
        const foundUser = users.find((u: any) =>
          u.email.toLowerCase() === inputIdentity ||
          u.username.toLowerCase() === inputIdentity
        );

        if (foundUser && foundUser.password === this.password) {
          // Success!
          await Haptics.impact({ style: ImpactStyle.Medium });

          // 3. SET CURRENT ACTIVE SESSION
          sessionStorage.setItem('user', JSON.stringify(foundUser));

          // 4. SYNC WITH AUTH SERVICE
          this.auth.setUser(foundUser);

          await loading.dismiss();
          this.router.navigate(['/tabs/home'], { replaceUrl: true });

        } else {
          await loading.dismiss();
          this.presentToast('Invalid username/email or password', 'danger');
        }
      } else {
        await loading.dismiss();
        this.presentToast('No accounts found in this session. Please register first.', 'warning');
      }
    } catch (error) {
      await loading.dismiss();
      console.error('Login Error:', error);
      this.presentToast('Login failed. Please try again.', 'danger');
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
 goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
  async presentToast(message: string, color: string = 'dark') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'top',
      color: color,
      mode: 'ios'
    });
    await toast.present();
  }


}

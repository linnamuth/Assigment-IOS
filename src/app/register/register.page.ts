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
        password: this.password,
        joinedDate: new Date().toISOString(),
        balance: 0,
        completedVideoIds: [],
        loanHistory: []
      };

      // ------------------------------
      // Access localStorage safely
      // ------------------------------
      if (typeof window !== 'undefined') {
        const storedUsers = localStorage.getItem('all_users_list');
        let usersArray = storedUsers ? JSON.parse(storedUsers) : [];

        const userExists = usersArray.some((u: any) => u.email === newUser.email);
        if (userExists) {
          await loading.dismiss();
          this.presentToast('Email already registered', 'danger');
          return;
        }

        // Save new user in localStorage
        usersArray.push(newUser);
        localStorage.setItem('all_users_list', JSON.stringify(usersArray));

        // Mark current session
        sessionStorage.setItem('user', JSON.stringify(newUser));
      }

      // Call your AuthService if needed
      this.auth.register(newUser);

      await loading.dismiss();
      // Navigate to home after registration
      this.router.navigate(['/tabs/home'], { replaceUrl: true });
      this.presentToast('Account created successfully!', 'success');

    } catch (error) {
      await loading.dismiss();
      this.presentToast('Storage error. Check browser settings.', 'danger');
      console.error(error);
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

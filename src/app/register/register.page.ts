import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { IonicModule, ToastController } from '@ionic/angular';
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
  showPassword = false; // Toggle for password visibility

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

async onRegister() {
  // 1. Validation
  if (!this.username || !this.email || !this.password) {
    this.presentToast('Please complete all fields');
    return;
  }

  try {
    const userData = {
      username: this.username.trim(),
      email: this.email.toLowerCase().trim(),
      password: this.password,
      joinedDate: new Date().toISOString()
    };

    await Haptics.impact({ style: ImpactStyle.Heavy });

    localStorage.setItem('user', JSON.stringify(userData));

    this.auth.register(userData);

    const navSuccess = await this.router.navigate(['/tabs/home']);

    if (navSuccess) {
      this.presentToast('Account created successfully!');
    } else {
      console.error('Navigation failed to /tabs/home');
      this.router.navigateByUrl('/tabs');
    }

  } catch (error) {
    console.error('Registration Error:', error);
    this.presentToast('Error saving account info');
  }
}
  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'top',
      mode: 'ios',
      color: 'dark'
    });
    toast.present();
  }
  goToLogin() {
  this.router.navigate(['/login']);
}
}

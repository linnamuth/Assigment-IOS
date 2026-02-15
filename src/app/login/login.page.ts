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
  styleUrls: ['./login.page.scss'], // Use your register scss for consistency
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class LoginPage {
  identity: string = ''; // Can be username or email
  password: string = '';
  showPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

async onLogin() {
 
  // READING FROM 'user'
  const savedUser = localStorage.getItem('user');

  if (savedUser) {
    const user = JSON.parse(savedUser);
    const inputIdentity = this.identity.toLowerCase().trim();

    if ((inputIdentity === user.username.toLowerCase() || inputIdentity === user.email.toLowerCase()) &&
         this.password === user.password) {

      this.auth.setUser(user); // Critical for AuthGuard!
      this.router.navigate(['/tabs/home']);

    } else {
      this.presentToast('Invalid credentials');
    }
  } else {
    this.presentToast('No account found. Please register.');
  }
}

  goToRegister() {
    this.router.navigate(['/register']);
  }

  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'top',
      color: 'dark',
      mode: 'ios'
    });
    toast.present();
  }


}

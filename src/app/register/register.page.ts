import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
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
export class RegisterPage implements OnInit {
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
ngOnInit(): void {
}

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
      joinedDate: new Date().toISOString()
    };

    // Get existing users from sessionStorage
    const storedUsers = sessionStorage.getItem('all_users_list');
    let usersArray = storedUsers ? JSON.parse(storedUsers) : [];

    // Check if email already exists
    const userExists = usersArray.some((u: any) => u.email === newUser.email);
    if (userExists) {
      await loading.dismiss();
      await this.presentToast('Email already registered', 'danger');
      return;
    }

    // Save new user in sessionStorage
    usersArray.push(newUser);
    sessionStorage.setItem('all_users_list', JSON.stringify(usersArray));

    // ✅ Also store active user so app knows they are logged in
    sessionStorage.setItem('active_user', JSON.stringify(newUser));

    await loading.dismiss();
    await this.presentToast('Account created successfully!', 'success');

    // Redirect to home page directly
    this.router.navigate(['/tabs/home'], { replaceUrl: true });

  } catch (error) {
    await loading.dismiss();
    await this.presentToast('Storage error. Check browser settings.', 'danger');
  }
}

  async presentToast(message: string, color: string = 'dark') {
  const toast = await this.toastCtrl.create({
    message,
    duration: 2500,
    position: 'bottom',
    mode: 'ios',
    color
  });
  await toast.present();
}

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

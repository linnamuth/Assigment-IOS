import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonicModule,
  AlertController,
  ToastController,
  LoadingController,
  NavController
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ProfilePage implements OnInit {
  user: any = null;

  constructor(
    private auth: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private navCtrl: NavController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  /**
   * 1. Load the active user from SessionStorage
   */
  loadUserData() {
    const data = sessionStorage.getItem('user');
    if (data) {
      this.user = JSON.parse(data);
    } else {
      // If no session found, redirect to login
      this.navCtrl.navigateRoot('/login');
    }
  }

  /**
   * 2. Open Edit Profile Alert
   */
  async openEditProfile() {
    const alert = await this.alertCtrl.create({
      header: 'Account Details',
      subHeader: 'Update your profile information',
      mode: 'ios',
      inputs: [
        {
          name: 'username',
          type: 'text',
          placeholder: 'Username',
          value: this.user.username
        },
        {
          name: 'email',
          type: 'email',
          placeholder: 'Email Address',
          value: this.user.email
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Update',
          handler: (data) => {
            this.updateProfile(data.username, data.email);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * 3. Persist profile changes to SessionStorage
   */
  async updateProfile(newUsername: string, newEmail: string) {
    if (!newUsername?.trim() || !newEmail?.trim()) {
      this.presentToast('Fields cannot be empty', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Updating profile...',
      spinner: 'crescent',
      mode: 'ios'
    });
    await loading.present();

    try {
      // Update the local user object
      this.user.username = newUsername;
      this.user.email = newEmail;

      // Save to SessionStorage
      sessionStorage.setItem('user', JSON.stringify(this.user));

      // Sync with the temporary "All Users" session list
      this.updateGlobalUserDatabase(this.user);

      // Notify AuthService to update other components (Header, etc.)
      this.auth.setUser(this.user);

      this.presentToast('Profile updated successfully!', 'success');
    } catch (error) {
      this.presentToast('Error updating profile', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  /**
   * 4. Sync session changes back to the session user list
   */
  private updateGlobalUserDatabase(updatedUser: any) {
    const allUsersJson = sessionStorage.getItem('all_users_list');
    if (allUsersJson) {
      let users = JSON.parse(allUsersJson);
      // Matching by unique email since username might change
      const index = users.findIndex((u: any) => u.email === updatedUser.email);

      if (index !== -1) {
        users[index] = { ...users[index], ...updatedUser };
        sessionStorage.setItem('all_users_list', JSON.stringify(users));
      }
    }
  }

  /**
   * 5. Logout Logic (Clears Session)
   */
  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Logout',
      message: 'Are you sure you want to log out? This will clear your current session.',
      mode: 'ios',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Yes',
          handler: () => {
            sessionStorage.clear(); // Wipes EVERYTHING in session (user, history, loan)
            this.navCtrl.navigateRoot('/login', { animated: true, animationDirection: 'back' });
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Image Handling
   */
  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Size check: 1MB limit to avoid SessionStorage quota issues
    if (file.size > 1024 * 1024) {
      this.presentToast('Image too large (Max 1MB)', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Uploading...', mode: 'ios' });
    await loading.present();

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64Image = reader.result as string;
      this.saveProfileImage(base64Image);
      loading.dismiss();
    };
  }

  private saveProfileImage(imageData: string) {
    if (this.user) {
      this.user.profilePic = imageData;

      // Update session storage
      sessionStorage.setItem('user', JSON.stringify(this.user));
      this.updateGlobalUserDatabase(this.user);
      this.auth.setUser(this.user);

      this.presentToast('Profile picture updated!', 'success');
    }
  }

  private async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 2000,
      position: 'top',
      mode: 'ios'
    });
    await toast.present();
  }
}

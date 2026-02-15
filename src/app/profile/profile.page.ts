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
import { AuthService } from '../services/auth.service'; // Adjust path to your AuthService
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
   * 1. Load the active user from LocalStorage
   */
  loadUserData() {
    const data = localStorage.getItem('user');
    if (data) {
      this.user = JSON.parse(data);
    } else {
      // If no user found, redirect to login
      this.router.navigate(['/login']);
    }
  }

  /**
   * 2. Open Edit Profile Alert
   */
  async openEditProfile() {
  const alert = await this.alertCtrl.create({
    header: 'Account Details',
    subHeader: 'Update your profile information',
    cssClass: 'custom-alert', // Use this class for custom styling
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
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Update',
        handler: (data) => {
          this.handleProfileUpdate(data.username, data.email);
        }
      }
    ]
  });

  await alert.present();
}
private async handleProfileUpdate(username: string, email: string) {
  if (!username || !email) {
    this.presentToast('Please fill out all fields', 'warning');
    return;
  }

  this.user.username = username;
  this.user.email = email;

  localStorage.setItem('user', JSON.stringify(this.user));
  this.auth.setUser(this.user); // Sync with other components

  this.presentToast('Profile updated successfully!', 'success');
}

  /**
   * 3. Persist profile changes to LocalStorage
   */
  async updateProfile(newUsername: string, newEmail: string) {
    if (!newUsername.trim() || !newEmail.trim()) {
      this.presentToast('Fields cannot be empty', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Updating profile...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Get the current user data
      const data = localStorage.getItem('user');
      if (data) {
        let currentUser = JSON.parse(data);

        // Update values
        currentUser.username = newUsername;
        currentUser.email = newEmail;

        // Save back to Session LocalStorage
        localStorage.setItem('user', JSON.stringify(currentUser));
        this.updateGlobalUserDatabase(currentUser);
        this.auth.setUser(currentUser);
        this.user = currentUser;

        this.presentToast('Profile updated successfully!', 'success');
      }
    } catch (error) {
      this.presentToast('Error updating profile', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  /**
   * 4. Sync session changes back to the permanent user list
   */
  private updateGlobalUserDatabase(updatedUser: any) {
    const allUsersJson = localStorage.getItem('all_users_list');
    if (allUsersJson) {
      let users = JSON.parse(allUsersJson);
      // Find user by ID (preferred) or unique username
      const index = users.findIndex((u: any) => u.username === updatedUser.username || u.email === updatedUser.email);

      if (index !== -1) {
        users[index] = { ...users[index], ...updatedUser };
        localStorage.setItem('all_users_list', JSON.stringify(users));
      }
    }
  }

  /**
   * 5. Logout Logic
   */
  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Logout',
      message: 'Are you sure you want to log out?',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Yes',
          handler: () => {
            localStorage.removeItem('user'); // Clear active session only
            this.navCtrl.navigateRoot('/login', { animated: true, animationDirection: 'back' });
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Helpers
   */
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
  async onFileSelected(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  // 1. Basic Validation (Size check: 1MB limit for LocalStorage safety)
  if (file.size > 1024 * 1024) {
    this.presentToast('Image too large. Please select an image under 1MB.', 'warning');
    return;
  }

  const loading = await this.loadingCtrl.create({
    message: 'Uploading...',
    duration: 2000
  });
  await loading.present();

  const reader = new FileReader();
  reader.readAsDataURL(file); // Convert to Base64

  reader.onload = () => {
    const base64Image = reader.result as string;
    this.saveProfileImage(base64Image);
    loading.dismiss();
  };
}

private saveProfileImage(imageData: string) {
  const userData = localStorage.getItem('user');
  if (userData) {
    const currentUser = JSON.parse(userData);

    // Save image string to user object
    currentUser.profilePic = imageData;

    // Update session and global database
    localStorage.setItem('user', JSON.stringify(currentUser));
    this.updateGlobalUserDatabase(currentUser);

    // Refresh local UI and sync with other pages
    this.user = currentUser;
    this.auth.setUser(currentUser);

    this.presentToast('Profile picture updated!', 'success');
  }
}
}


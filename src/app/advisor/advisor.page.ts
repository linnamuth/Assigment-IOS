import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonicModule,
  ModalController,
  ActionSheetController,
  ToastController,
  LoadingController
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { VideoModalComponent } from '../video-modal/video-modal.component';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

interface VideoTask {
  id: number;
  title: string;
  description: string;
  reward: number;
  duration: string;
  image: string;
  videoUrl: string;
  collected: boolean;
}

@Component({
  selector: 'app-advisor',
  templateUrl: './advisor.page.html',
  styleUrls: ['./advisor.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AdvisorPage implements OnInit {
  public refLink: string = 'https://yourapp.com/ref/guest';
  private readonly SHARE_TEXT = 'Join Play Advisor and start earning rewards for watching videos!';

  userBalance: number = 0;
  referralCollected: boolean = false;
  isLoading: boolean = true;
  videoTasks: VideoTask[] = [];

  constructor(
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.initUserPage();
  }

  /**
   * 1. INITIALIZE PAGE BASED ON SESSION DATA
   */
  async initUserPage() {
    // CHANGED: Reading from sessionStorage
    const userData = sessionStorage.getItem('user');

    if (userData) {
      const user = JSON.parse(userData);

      this.userBalance = user.balance || 0;
      this.referralCollected = user.referralClaimed || false;
      this.refLink = `https://yourapp.com/ref/${user.username || 'user'}`;

      // Load tasks and sync with the user's session-based progress
      await this.loadDynamicData(user.completedVideoIds || []);
    } else {
      this.isLoading = false;
    }
  }

  async loadDynamicData(completedIds: number[], event?: any) {
    this.isLoading = true;

    // Simulate API Fetch
    setTimeout(() => {
      const availableTasks: VideoTask[] = [
        {
          id: 1,
          title: 'Financial Tips 2026',
          description: 'Watch 1 min to earn $0.10 instantly.',
          reward: 0.1,
          duration: '5 min',
          image: 'https://i.ytimg.com/vi/d0J-lW878qQ/hqdefault.jpg',
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          collected: false
        },
        {
          id: 2,
          title: 'Market Analysis',
          description: 'Earn $0.20 by completing this task.',
          reward: 0.2,
          duration: '8 min',
          image: 'https://i.ytimg.com/vi/3JZ_D3ELwOQ/hqdefault.jpg',
          videoUrl: 'https://www.w3schools.com/html/movie.mp4',
          collected: false
        }
      ];

      this.videoTasks = availableTasks.map(task => ({
        ...task,
        collected: completedIds.includes(task.id)
      }));

      this.isLoading = false;
      if (event) event.target.complete();
    }, 1000);
  }

  /**
   * 2. PERSIST REWARDS TO SESSION STORAGE
   */
  private async persistUserReward(amount: number, videoId?: number) {
    // CHANGED: Reading from sessionStorage
    const userData = sessionStorage.getItem('user');

    if (userData) {
      const user = JSON.parse(userData);

      // Update Balance
      user.balance = Number(((user.balance || 0) + amount).toFixed(2));

      // Update Video Progress
      if (videoId) {
        if (!user.completedVideoIds) user.completedVideoIds = [];
        if (!user.completedVideoIds.includes(videoId)) {
          user.completedVideoIds.push(videoId);
        }
      }

      // Update Referral Status
      if (amount === 1.0) {
        user.referralClaimed = true;
      }

      // Save updated user to current session
      sessionStorage.setItem('user', JSON.stringify(user));

      // NEW: Sync with global session user list to maintain data across the app session
      this.syncWithGlobalSession(user);

      // Update local UI and Auth Service
      this.userBalance = user.balance;
      this.auth.setUser(user);
    }
  }

  private syncWithGlobalSession(updatedUser: any) {
    const allUsersJson = sessionStorage.getItem('all_users_list');
    if (allUsersJson) {
      let users = JSON.parse(allUsersJson);
      const index = users.findIndex((u: any) => u.email === updatedUser.email);
      if (index !== -1) {
        users[index] = updatedUser;
        sessionStorage.setItem('all_users_list', JSON.stringify(users));
      }
    }
  }

  /**
   * 3. VIDEO & REFERRAL LOGIC
   */
  async playVideo(video: VideoTask) {
    if (video.collected) {
      this.presentToast('Reward already claimed!', 'warning');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: VideoModalComponent,
      componentProps: {
        videoUrl: video.videoUrl,
        title: video.title,
        reward: video.reward,
        requiredSeconds: 10
      },
      cssClass: 'glass-modal',
      mode: 'ios'
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data?.rewardCollected) {
      video.collected = true;
      await this.persistUserReward(video.reward, video.id);
      this.presentToast(`Success! $${video.reward} added to your account.`, 'success');
    }
  }

  async shareReferral() {
    if (this.referralCollected) {
      this.presentToast('Referral reward already claimed!', 'dark');
      return;
    }

    await Haptics.impact({ style: ImpactStyle.Medium });

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'EXPAND YOUR NETWORK',
      subHeader: 'Share to claim your $1.00 bonus',
      mode: 'ios',
      buttons: [
        {
          text: 'Telegram',
          icon: 'paper-plane',
          handler: () => { this.processReferral('telegram'); }
        },
        {
          text: 'Messenger',
          icon: 'chatbubble-ellipses',
          handler: () => { this.processReferral('messenger'); }
        },
        { text: 'Cancel', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  private async processReferral(platform: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Verifying Share...',
      duration: 1000,
      spinner: 'crescent',
      mode: 'ios'
    });
    await loading.present();

    if (platform === 'telegram') this.openTelegram();
    else this.openMessenger();

    setTimeout(async () => {
      this.referralCollected = true;
      await this.persistUserReward(1.00);
      await Haptics.notification({ type: NotificationType.Success });
      this.presentToast('🎉 $1.00 Network Bonus Added!', 'success');
    }, 1100);
  }

  private openTelegram() {
    const url = `https://t.me/share/url?url=${encodeURIComponent(this.refLink)}&text=${encodeURIComponent(this.SHARE_TEXT)}`;
    window.open(url, '_system');
  }

  private openMessenger() {
    const url = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(this.refLink)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(this.refLink)}`;
    window.open(url, '_system');
  }

  private async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color: color,
      position: 'top',
      mode: 'ios'
    });
    await toast.present();
  }
}

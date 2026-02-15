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
import { AuthService } from '../services/auth.service'; // Ensure this path is correct
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
  // Referral Properties
  public refLink: string = 'https://yourapp.com/ref/guest';
  private readonly SHARE_TEXT = 'Join Play Advisor and start earning rewards for watching videos!';

  // User States
  userBalance: number = 0;
  referralCollected: boolean = false;
  isLoading: boolean = true;
  videoTasks: VideoTask[] = [];

  constructor(
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private auth: AuthService // Injected to manage user-specific data
  ) {}

  ngOnInit() {
    this.initUserPage();
  }

  /**
   * 1. INITIALIZE PAGE BASED ON LOGGED-IN USER
   */
  async initUserPage() {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);

      // Set local variables from the user object
      this.userBalance = user.balance || 0;
      this.referralCollected = user.referralClaimed || false;
      this.refLink = `https://yourapp.com/ref/${user.username || 'user'}`;

      // Load tasks and mark which ones this specific user has finished
      await this.loadDynamicData(user.completedVideoIds || []);
    } else {
      // Fallback if no user found
      this.isLoading = false;
    }
  }

  /**
   * 2. LOAD TASKS & SYNC WITH USER PROGRESS
   */
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

      // Map tasks to check if THIS user has already collected them
      this.videoTasks = availableTasks.map(task => ({
        ...task,
        collected: completedIds.includes(task.id)
      }));

      this.isLoading = false;
      if (event) event.target.complete();
    }, 1000);
  }

  /**
   * 3. UPDATE USER DATA IN LOCAL STORAGE AND AUTH SERVICE
   */
  private async persistUserReward(amount: number, videoId?: number) {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);

      // Update Balance
      user.balance = (user.balance || 0) + amount;

      // If it was a video, add to their unique completed list
      if (videoId) {
        if (!user.completedVideoIds) user.completedVideoIds = [];
        if (!user.completedVideoIds.includes(videoId)) {
          user.completedVideoIds.push(videoId);
        }
      }

      // If it was a referral reward
      if (amount === 1.0) {
        user.referralClaimed = true;
      }

      // Save to LocalStorage permanently
      localStorage.setItem('user', JSON.stringify(user));

      // Update local UI variables
      this.userBalance = user.balance;

      // Update AuthService so Home/Profile pages see the new balance
      this.auth.setUser(user);
    }
  }

  /**
   * 4. VIDEO LOGIC
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
      cssClass: 'glass-modal'
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data?.rewardCollected) {
      video.collected = true;
      await this.persistUserReward(video.reward, video.id);
      this.presentToast(`Success! $${video.reward} added to your account.`, 'success');
    }
  }

  /**
   * 5. REFERRAL LOGIC
   */
  async shareReferral() {
    if (this.referralCollected) {
      this.presentToast('Referral reward already claimed!', 'dark');
      return;
    }

    await Haptics.impact({ style: ImpactStyle.Medium });

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'EXPAND YOUR NETWORK',
      subHeader: 'Share to claim your $1.00 bonus',
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
      spinner: 'crescent'
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

  // Helper Methods
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

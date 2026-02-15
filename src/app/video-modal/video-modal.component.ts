import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, LoadingController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cashOutline, timeOutline, checkmarkCircle } from 'ionicons/icons';

@Component({
  selector: 'app-video-modal',
  templateUrl: './video-modal.component.html',
  styleUrls: ['./video-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class VideoModalComponent {
  @Input() videoUrl!: string;
  @Input() title!: string;
  @Input() reward!: number;
  @Input() requiredSeconds: number = 10; // User must watch 60s to unlock

  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  // State variables
  canCollect: boolean = false;
  isProcessing: boolean = false;
  watchProgress: number = 0;
  displayTime: string = '0s';

  constructor(
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    addIcons({ cashOutline, timeOutline, checkmarkCircle });
  }

  // Gets called once the video file is loaded
  onMetadataLoaded(event: any) {
    console.log('Video loaded. Duration:', event.target.duration);
  }

  onTimeUpdate(event: any) {
    const video = event.target as HTMLVideoElement;
    const currentTime = video.currentTime;

    this.watchProgress = Math.min(currentTime / this.requiredSeconds, 1);

    const currentSec = Math.floor(currentTime);
    this.displayTime = `${currentSec}s / ${this.requiredSeconds}s`;

    if (currentTime >= this.requiredSeconds && !this.canCollect) {
      this.canCollect = true;
    }
  }

  async collectReward() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const loading = await this.loadingCtrl.create({
      message: 'Verifying watch time...',
      duration: 1500,
      spinner: 'circles',
    });
    await loading.present();

    await loading.onDidDismiss();

    const toast = await this.toastCtrl.create({
      message: `🎉 Success! $${this.reward} added to balance.`,
      duration: 2500,
      color: 'success',
      position: 'top'
    });
    await toast.present();

    // Dismiss and tell the parent page the reward was earned
    this.modalCtrl.dismiss({ rewardCollected: true });
  }

  closeModal() {
    this.modalCtrl.dismiss({ rewardCollected: false });
  }
}

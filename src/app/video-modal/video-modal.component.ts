import { Component, NgZone, Input, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

declare var YT: any;

@Component({
  selector: 'app-video-modal',
  templateUrl: './video-modal.component.html',
  styleUrls: ['./video-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class VideoModalComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() videoUrl: string = '';
  @Input() reward: number = 0.10;
  @Input() requiredSeconds: number = 60;

  watchProgress = 0;
  canCollect = false;
  isProcessing = false;
  rewardClaimed = false;
  displayTime = '00:00';

  private player: any;
  private intervalId: any;

  constructor(
    private zone: NgZone,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    this.updateTimerDisplay(this.requiredSeconds);
  }

  ngAfterViewInit() {
    const videoId = this.extractVideoId(this.videoUrl);
    if (videoId) this.initYoutube(videoId);
  }

  ngOnDestroy() {
    this.stopTracking();
    if (this.player?.destroy) this.player.destroy();
  }

  private extractVideoId(url: string): string | null {
    const reg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|embed|shorts)\/|.*[?&]v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
    const match = url.match(reg);
    return match ? match[1] : null;
  }

  private initYoutube(videoId: string) {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }

    const setup = () => {
      this.player = new YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: {
          'autoplay': 1,
          'controls': 1,
          'modestbranding': 1,
          'rel': 0,
          'iv_load_policy': 3,
          'fs': 0,
          'origin': window.location.origin
        },
        events: {
          'onStateChange': (e: any) => this.onStateChange(e)
        }
      });
    };

    if ((window as any).YT?.Player) setup();
    else (window as any).onYouTubeIframeAPIReady = () => setup();
  }

  private onStateChange(event: any) {
    if (event.data === 1) this.startTracking();
    else this.stopTracking();
  }

  private startTracking() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.zone.run(() => {
        if (!this.player || !this.player.getCurrentTime) return;
        const currentTime = this.player.getCurrentTime();

        if (!this.rewardClaimed) {
          this.watchProgress = Math.min(currentTime / this.requiredSeconds, 1);
          const remaining = Math.max(this.requiredSeconds - currentTime, 0);
          this.updateTimerDisplay(remaining);
          if (currentTime >= this.requiredSeconds) this.canCollect = true;
        }
      });
    }, 500);
  }

  private stopTracking() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  private updateTimerDisplay(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    this.displayTime = `${m}:${s.toString().padStart(2, '0')}`;
  }

async collectReward() {
  if (!this.canCollect || this.isProcessing) return;
  this.isProcessing = true;

  setTimeout(async () => {
    this.isProcessing = false;
    this.rewardClaimed = true;
    this.canCollect = false;
    this.watchProgress = 1;

    const toast = await this.toastCtrl.create({
      message: `Success! $${this.reward} collected.`,
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();

    // After the toast, close the modal and send the money back!
    this.modalCtrl.dismiss({
      claimedAmount: this.reward,
      success: true
    });
  }, 1000);
}

// Update your close function to handle cases where they don't claim
close() {
  this.modalCtrl.dismiss({ success: false });
}
}

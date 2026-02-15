import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  searchOutline, optionsOutline, chevronForwardOutline,
  alertCircleOutline, cashOutline, calendarOutline,
  trendingUpOutline, timeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss']
})
export class HistoryPage {
  allHistory: any[] = [];
  groupedHistory: { label: string, items: any[] }[] = [];

  searchText: string = '';
  selectedFilter: string = 'All Time';

  constructor(private modalCtrl: ModalController) {
    addIcons({
      searchOutline, optionsOutline, chevronForwardOutline,
      alertCircleOutline, cashOutline, calendarOutline,
      trendingUpOutline, timeOutline
    });
  }

  ionViewWillEnter() {
    this.loadData();
  }

 loadData() {
  // 1. Get the specific logged-in user
  const userData = localStorage.getItem('user');

  if (userData) {
    const user = JSON.parse(userData);

    // 2. Pull history from the USER object, not the global list
    // We use an empty array [] as a fallback if the user has no history yet
    this.allHistory = user.loanHistory || [];

    console.log('Loaded history for:', user.username);
  } else {
    this.allHistory = [];
  }

  this.applyFilters();
}

  setFilter(filter: string) {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.allHistory];
    if (this.searchText.trim() !== '') {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.amount?.toString().includes(search) ||
        item.duration?.toString().includes(search)
      );
    }

    const now = Date.now();
    if (this.selectedFilter === 'Today') {
      const todayStr = new Date().toLocaleDateString();
      filtered = filtered.filter(item => new Date(item.timestamp).toLocaleDateString() === todayStr);
    } else if (this.selectedFilter === 'Last 7 Days') {
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(item => item.timestamp >= sevenDaysAgo);
    }

    filtered.sort((a, b) => b.timestamp - a.timestamp);
    this.groupData(filtered);
  }

  private groupData(items: any[]) {
    const groups: any = {};
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

    items.forEach(item => {
      const itemDate = new Date(item.timestamp).toLocaleDateString();
      let label = (itemDate === today) ? 'TODAY' :
                  (itemDate === yesterday) ? 'YESTERDAY' :
                  new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });

    this.groupedHistory = Object.keys(groups).map(key => ({ label: key, items: groups[key] }));
  }

  async openDetail(item: any) {
    const modal = await this.modalCtrl.create({
      component: HistoryDetailComponent,
      componentProps: { data: item },
      breakpoints: [0, 0.5, 0.85],
      initialBreakpoint: 0.5,
      handle: true,
      cssClass: 'custom-modal'
    });
    return await modal.present();
  }

  formatCurrency(val: any) {
    const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
    return isNaN(num) ? '$0.00' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  }
}

/** --- POPUP DETAIL COMPONENT --- **/
@Component({
  selector: 'app-history-detail',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <ion-content class="ion-padding">
      <div class="modal-header">
        <div class="icon-circle"><ion-icon name="cash-outline"></ion-icon></div>
        <h2>Calculation Detail</h2>
        <p>Calculated at {{ data.time }}</p>
      </div>

      <div class="detail-list">
        <div class="detail-row">
          <span class="label">Amount</span>
          <span class="value">{{ formatCurrency(data.amount) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Monthly Pay</span>
          <span class="value primary">{{ formatCurrency(data.monthly) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Duration</span>
          <span class="value">{{ data.duration }} Months</span>
        </div>
        <div class="detail-row">
          <span class="label">Interest Rate</span>
          <span class="value">{{ data.interestRate }}%</span>
        </div>
      </div>

      <ion-button expand="block" mode="ios" shape="round" (click)="close()">Dismiss</ion-button>
    </ion-content>
  `,
  styles: [`
    .modal-header { text-align: center; margin: 10px 0 25px; }
    .icon-circle {
      width: 60px; height: 60px; background: #ebf4ff; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 15px; color: #3880ff; font-size: 30px;
    }
    h2 { font-weight: 800; color: #1e293b; margin: 0; }
    p { color: #64748b; font-size: 14px; margin-top: 5px; }
    .detail-list { margin-bottom: 30px; background: #f8fafc; border-radius: 16px; padding: 10px; }
    .detail-row {
      display: flex; justify-content: space-between; padding: 15px;
      border-bottom: 1px solid #edf2f7;
    }
    .detail-row:last-child { border: none; }
    .label { color: #64748b; font-weight: 600; font-size: 14px; }
    .value { color: #1e293b; font-weight: 700; }
    .primary { color: #3880ff; }
  `]
})
export class HistoryDetailComponent {
  data: any;
  constructor(private modalCtrl: ModalController) {}
  formatCurrency(val: any) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  }
  close() { this.modalCtrl.dismiss(); }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  searchOutline, optionsOutline, chevronForwardOutline,
  alertCircleOutline, cashOutline, calendarOutline,
  trendingUpOutline, timeOutline, checkmarkCircle
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
      trendingUpOutline, timeOutline, checkmarkCircle
    });
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    const userData = sessionStorage.getItem('active_user');
    if (userData) {
      const user = JSON.parse(userData);
      this.allHistory = user.loanHistory || [];
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

    // Search filtering
    if (this.searchText.trim() !== '') {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.amount?.toString().includes(search) ||
        item.duration?.toString().includes(search) ||
        item.monthly?.toString().includes(search)
      );
    }

    // Date filtering with safety guards
    const now = Date.now();
    if (this.selectedFilter === 'Today') {
      const todayStr = new Date().toLocaleDateString();
      filtered = filtered.filter(item => item.timestamp && new Date(item.timestamp).toLocaleDateString() === todayStr);
    } else if (this.selectedFilter === 'Last 7 Days') {
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(item => item.timestamp && item.timestamp >= sevenDaysAgo);
    }

    filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    this.groupData(filtered);
  }

  private groupData(items: any[]) {
    const groups: any = {};
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

    items.forEach(item => {
      if (!item.timestamp || isNaN(new Date(item.timestamp).getTime())) {
        return; // This "continues" to the next item, skipping the old/broken record
      }

      const dateObj = new Date(item.timestamp);
      const itemDateStr = dateObj.toLocaleDateString();

      // 2. DETERMINE LABEL
      let label = (itemDateStr === today) ? 'TODAY' :
        (itemDateStr === yesterday) ? 'YESTERDAY' :
          dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      if (label !== 'Invalid Date') {
        if (!groups[label]) groups[label] = [];
        groups[label].push(item);
      }
    });

    this.groupedHistory = Object.keys(groups).map(key => ({
      label: key,
      items: groups[key]
    }));
  }

  async openDetail(item: any) {
    const modal = await this.modalCtrl.create({
      component: HistoryDetailComponent,
      componentProps: { data: item },
      breakpoints: [0, 0.6, 0.9],
      initialBreakpoint: 0.6,
      handle: true,
      cssClass: 'custom-modal',
      mode: 'ios'
    });
    return await modal.present();
  }

  formatCurrency(val: any) {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
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
        <div class="icon-circle" [class.completed]="data.status === 'Completed'">
          <ion-icon [name]="data.status === 'Completed' ? 'checkmark-circle' : 'cash-outline'"></ion-icon>
        </div>
        <h2>Loan Detail</h2>
        <p *ngIf="data.timestamp">Recorded: {{ data.timestamp | date:'short' }}</p>
      </div>

      <div class="detail-list">
        <div class="detail-row">
          <span class="label">Total Amount</span>
          <span class="value">{{ formatCurrency(data.amount) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Monthly Installment</span>
          <span class="value primary">{{ formatCurrency(data.monthly) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Duration</span>
          <span class="value">{{ data.duration }} Months</span>
        </div>
        <div class="detail-row">
          <span class="label">Interest Rate</span>
          <span class="value">{{ data.interest || data.interestRate }}%</span>
        </div>
        <div class="detail-row">
          <span class="label">Status</span>
          <span class="value status-text" [class.done]="data.status === 'Completed'">{{ data.status || 'Active' }}</span>
        </div>
      </div>

      <ion-button expand="block" mode="ios" shape="round" color="dark" (click)="close()">Close</ion-button>
    </ion-content>
  `,
  styles: [`
    .modal-header { text-align: center; margin-bottom: 20px; }
    .icon-circle {
      width: 60px; height: 60px; background: #ebf4ff; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 15px; color: #3880ff; font-size: 30px;
    }
    .icon-circle.completed { background: #e6fffa; color: #2dd36f; }
    h2 { font-weight: 800; color: #1e293b; margin: 0; }
    p { color: #64748b; font-size: 14px; }
    .detail-list { margin-bottom: 30px; background: #f8fafc; border-radius: 16px; padding: 10px; }
    .detail-row { display: flex; justify-content: space-between; padding: 15px; border-bottom: 1px solid #edf2f7; }
    .detail-row:last-child { border: none; }
    .label { color: #64748b; font-weight: 600; }
    .value { color: #1e293b; font-weight: 700; }
    .primary { color: #3880ff; }
    .status-text.done { color: #2dd36f; }
  `]
})
export class HistoryDetailComponent {
  data: any;
  constructor(private modalCtrl: ModalController) { }
  formatCurrency(val: any) {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  }
  close() { this.modalCtrl.dismiss(); }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonTab, IonRouterOutlet } from '@ionic/angular/standalone';
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [IonIcon, IonTabButton, IonTabBar, IonTabs, CommonModule, FormsModule]
})
export class TabsPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}

import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard'; // Import your guard

export const routes: Routes = [
  // 1. Smart Redirect: If they hit '', the Guard handles the logic
  {
    path: '',
    redirectTo: 'tabs/home',
    pathMatch: 'full'
  },

  {
    path: 'tabs',
    canActivate: [authGuard], // 👈 This protects all tab pages
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      { path: 'home', loadComponent: () => import('./home/home.page').then(m => m.HomePage) },
      { path: 'upload-document', loadComponent: () => import('./upload-document/upload-document.page').then(m => m.UploadDocumentPage) },
      { path: 'application-status', loadComponent: () => import('./application-status/application-status.page').then(m => m.ApplicationStatusPage) },
      { path: 'repayment-schedule', loadComponent: () => import('./repayment-schedule/repayment-schedule.page').then(m => m.RepaymentSchedulePage) },
      { path: 'advisor', loadComponent: () => import('./advisor/advisor.page').then(m => m.AdvisorPage) },
      {
        path: 'history',
        loadComponent: () => import('./history/history.page').then(m => m.HistoryPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage)
      }
    ]
  },

  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage)
  },

  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  }
];

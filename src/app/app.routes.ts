import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [

  // Public pages first
  {
    path: 'login',
    loadComponent: () => import('./login/login.page')
      .then(m => m.LoginPage)
  },

  {
    path: 'register',
    loadComponent: () => import('./register/register.page')
      .then(m => m.RegisterPage)
  },


  // Protected tabs
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./tabs/tabs.page')
      .then(m => m.TabsPage),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      { path: 'home', loadComponent: () => import('./home/home.page').then(m => m.HomePage) },
      { path: 'upload-document', loadComponent: () => import('./upload-document/upload-document.page').then(m => m.UploadDocumentPage) },
      { path: 'application-status', loadComponent: () => import('./application-status/application-status.page').then(m => m.ApplicationStatusPage) },
      { path: 'repayment-schedule', loadComponent: () => import('./repayment-schedule/repayment-schedule.page').then(m => m.RepaymentSchedulePage) },
      { path: 'advisor', loadComponent: () => import('./advisor/advisor.page').then(m => m.AdvisorPage) },
      { path: 'history', loadComponent: () => import('./history/history.page').then(m => m.HistoryPage) },
      { path: 'profile', loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage) }
    ]
  },

  // Default redirect → login (important)
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // Catch unknown routes
  {
    path: '**',
    redirectTo: 'login'
  },


];

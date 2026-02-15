import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'user';

  // Initialize stream with LocalStorage data
  private userSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  user$ = this.userSubject.asObservable();

  constructor() {}

  private getUserFromStorage() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  // REGISTER: Save the initial loan data
  register(userData: any) {
    const newUser = {
      ...userData,
      balance: 0.00, // Starting loan balance
      creditLimit: 5000, // Default limit
      joined: new Date().toISOString()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newUser));
    this.userSubject.next(newUser);
  }

  // LOGIN: Set the active session using stored loan data
  setUser(user: any) {
    this.userSubject.next(user);
  }

  // LOGOUT: Clear session but KEEP the loan data in storage
  logout() {
    this.userSubject.next(null);
  }
}

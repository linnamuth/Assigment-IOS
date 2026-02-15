import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface LoanData {
  amount: number;
  monthlyPayment: number;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private loanDataSubject = new BehaviorSubject<LoanData | null>(null);
  loanData$ = this.loanDataSubject.asObservable();

  // Save loan data
  setLoan(data: LoanData) {
    this.loanDataSubject.next(data);
  }

  // Get current loan data
  getLoan(): LoanData | null {
    return this.loanDataSubject.getValue();
  }
}

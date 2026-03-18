import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { map } from 'rxjs/operators'; // Dodato za paginaciju kada pređeš na backend
import { environment } from '../../../../environments/environment';
import { Account, ChangeLimitDto } from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly baseUrl = `${environment.apiUrl}/client/accounts`;

  constructor(private http: HttpClient) {}

  getMyAccounts(): Observable<Account[]> {
     return this.http.get<any>(this.baseUrl).pipe(map(res => res.content));
  }

  getAccountById(id: number): Observable<Account> {
     return this.http.get<Account>(`${this.baseUrl}/${id}`);
  }

  renameAccount(id: number, name: string): Observable<void> {
     return this.http.patch<void>(`${this.baseUrl}/${id}/name`, { accountName: name });
  }

  changeLimit(id: number, dailyLimit: number, monthlyLimit: number): Observable<void> {
     return this.http.patch<void>(`${this.baseUrl}/${id}/limit`, { accountLimit: dailyLimit });
  }

  createAccount(payload: any): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }
}
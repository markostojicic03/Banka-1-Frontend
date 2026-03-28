import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Account, ChangeLimitDto } from '../models/account.model';
import { Transaction, TransactionPage } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly baseUrl = `${environment.apiUrl}/accounts/client/accounts`;
  private readonly api = `${environment.apiUrl}/accounts`;

  constructor(private http: HttpClient) {}

  getMyAccounts(): Observable<Account[]> {
    const page = 0;
    const size = 50;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map((res) => {
        if (!res.content) return [];
        return res.content.map((item: any) =>
          this.mapToAccountFromClient(item),
        );
      }),
    );
  }
  /**
   * Employee endpoint for all accounts in the system.
   */
  getAllAccounts(): Observable<Account[]> {
    const page = 0;
    const size = 10;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<any>(`${environment.apiUrl}/accounts/employee/accounts`, { params })
      .pipe(
        map((res) => {
          if (!res.content) return [];
          return res.content.map((item: any) => this.mapToAccount(item));
        }),
      );
  }

  private mapToAccount(item: any): Account {
    const ownerName = `${item.ime || ''} ${item.prezime || ''}`.trim();
    const subtype = this.mapToSubtype(
      item.accountOwnershipType,
      item.tekuciIliDevizni,
    );

    return {
      id: 0, // Not provided by API
      name: ownerName,
      accountNumber: item.brojRacuna || '',
      balance: 0,
      availableBalance: 0,
      reservedFunds: 0,
      currency: item.tekuciIliDevizni === 'devizni' ? 'EUR' : 'RSD', // Default to EUR for devizni
      status: 'ACTIVE', // Default status
      subtype: subtype,
      ownerId: 0,
      ownerName: ownerName,
      employeeId: 0,
      maintenanceFee: 0,
      dailyLimit: 0,
      monthlyLimit: 0,
      dailySpending: 0,
      monthlySpending: 0,
      createdAt: new Date().toISOString(),
      expiryDate: '',
    } as Account;
  }

  private mapToSubtype(ownership: string, type: string): any {
    if (ownership === 'BUSINESS') {
      return type === 'devizni' ? 'FOREIGN_BUSINESS' : 'DOO';
    }
    return type === 'devizni' ? 'FOREIGN_PERSONAL' : 'STANDARD';
  }

  private mapToAccountFromClient(item: any): Account {
    const subtype = this.mapToSubtypeFromClient(
      item.accountType,
      item.accountCategory,
    );

    return {
      id: 0, // Not provided by API
      name: item.nazivRacuna || '',
      accountNumber: item.brojRacuna || '',
      balance: 0,
      availableBalance: item.raspolozivoStanje || 0,
      reservedFunds: 0,
      currency: item.currency || 'RSD',
      status: 'ACTIVE', // Assume all returned accounts are active
      subtype: subtype,
      ownerId: 0,
      ownerName: '',
      employeeId: 0,
      maintenanceFee: 0,
      dailyLimit: 0,
      monthlyLimit: 0,
      dailySpending: 0,
      monthlySpending: 0,
      createdAt: new Date().toISOString(),
      expiryDate: '',
    } as Account;
  }

  private mapToSubtypeFromClient(
    accountType: string,
    accountCategory: string,
  ): any {
    if (accountType === 'BUSINESS') {
      return accountCategory === 'CHECKING' ? 'DOO' : 'AD';
    }
    return accountCategory === 'CHECKING' ? 'STANDARD' : 'SAVINGS';
  }

  getAccountById(id: number): Observable<Account> {
    return this.http.get<Account>(`${this.baseUrl}/${id}`);
  }

  getTransactions(
    accountNumber: number,
    page = 0,
    size = 5,
  ): Observable<Transaction[]> {
    return this.http
      .get<TransactionPage>(`${environment.apiUrl}/transactions/employee/accounts/${accountNumber}`, {
        params: { page: page.toString(), size: size.toString() },
      })
      .pipe(map((res) => res.content));
  }

  renameAccount(accountNumber: number, name: string): Observable<void> {
    return this.http.put<void>(
      `${this.api}/client/api/accounts/${accountNumber}/name`,
      { accountName: name },
    );
  }

  changeLimit(
    accountNumber: number,
    dailyLimit: number,
    monthlyLimit: number,
    verificationCode: string,
    verificationSessionId: string,
  ): Observable<void> {
    return this.http.put<void>(
      `${this.api}/client/api/accounts/${accountNumber}/limits`,
      {
        dailyLimit: dailyLimit,
        monthlyLimit: monthlyLimit,
        verificationCode: verificationCode,
        verificationSessionId: +verificationSessionId,
      } as ChangeLimitDto,
    );
  }

  createFxAccount(payload: any): Observable<any> {
    return this.http.post(
      `${this.api}/employee/accounts/fx`,
      payload,
    );
  }

  createCheckingAccount(payload: any): Observable<any> {
    return this.http.post(
      `${this.api}/employee/accounts/checking`,
      payload,
    );
  }

  /**
   * Activate/deactivate account by account ID.
   * Backend endpoint is expected to accept status update.
   */
  updateAccountStatus(
    accountNumber: number,
    status: 'ACTIVE' | 'INACTIVE',
  ): Observable<void> {
    return this.http.put<void>(
      `${this.api}/employee/accounts/${accountNumber}/status`,
      {
        status,
      },
    );
  }
}

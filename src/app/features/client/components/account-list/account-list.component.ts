import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AccountService } from '../../services/account.service';
import { Account } from '../../models/account.model';

@Component({
  selector: 'app-account-list',
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss']
})
export class AccountListComponent implements OnInit {
  public accounts: Account[] = [];
  public selectedAccount: Account | null = null;
  public isLoading = false;
  public errorMessage = '';

  constructor(
      private readonly accountService: AccountService,
      private readonly router: Router
  ) {}




  public ngOnInit(): void {
    this.loadAccounts();
  }

  /**
   * Dohvata aktivne račune klijenta i sortira ih po raspoloživom stanju opadajuće.
   * Po defaultu selektuje prvi račun u listi.
   */
  private loadAccounts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.accountService.getMyAccounts().subscribe({
      next: (accounts: Account[]) => {
        this.accounts = accounts
            .filter(acc => acc.status === 'ACTIVE')
            .sort((a, b) => b.availableBalance - a.availableBalance);

        if (this.accounts.length > 0) {
          this.selectedAccount = this.accounts[0];
        }

        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage =
            error.error?.message ||
            error.error?.error ||
            'Greška pri učitavanju računa. Pokušajte ponovo.';
      }
    });
  }

  /**
   * Selektuje račun i prikazuje njegove transakcije ispod liste.
   * Napomena iz specifikacije: označavanje računa i dugme "Detalji" su dve različite funkcionalnosti.
   */
  public selectAccount(account: Account): void {
    this.selectedAccount = account;
  }

  /**
   * Proverava da li je dati račun trenutno selektovan.
   */
  public isSelected(account: Account): boolean {
    return this.selectedAccount?.id === account.id;
  }

  /**
   * Naviguje na stranicu sa detaljima računa (F3/F4).
   * stopPropagation sprečava da se triggeruje selectAccount.
   */
  public goToDetails(account: Account, event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/accounts', account.id]);
  }

  /**
   * Maskira broj računa — prikazuje samo poslednjih 4 karaktera.
   * Primer: "265000000001111111" → "**** 1111"
   */
  public maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) return accountNumber;
    return `**** ${accountNumber.slice(-4)}`;
  }

  /**
   * Formatira iznos kao valutu bez currency simbola — valutu prikazujemo odvojeno.
   * Primer: 81556.74 → "81.556,74"
   */
  public formatAmount(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Vraća CSS klasu za gradijent thumbnai-a na osnovu podvrste računa.
   */
  public getAccountGradient(account: Account): string {
    const map: Record<string, string> = {
      STANDARD:        'thumb--blue',
      SAVINGS:         'thumb--purple',
      PENSION:         'thumb--green',
      YOUTH:           'thumb--pink',
      STUDENT:         'thumb--indigo',
      UNEMPLOYED:      'thumb--teal',
      DOO:             'thumb--orange',
      AD:              'thumb--red',
      FOUNDATION:      'thumb--amber',
      FOREIGN_PERSONAL:'thumb--cyan',
      FOREIGN_BUSINESS:'thumb--slate',
    };
    return map[account.subtype] ?? 'thumb--blue';
  }

  /**
   * Vraća human-readable naziv podvrste računa.
   */
  public getAccountLabel(account: Account): string {
    const labels: Record<string, string> = {
      STANDARD:        'Standardni tekući',
      SAVINGS:         'Štedni',
      PENSION:         'Penzionerski',
      YOUTH:           'Za mlade',
      STUDENT:         'Za studente',
      UNEMPLOYED:      'Za nezaposlene',
      DOO:             'Poslovni (DOO)',
      AD:              'Poslovni (AD)',
      FOUNDATION:      'Fondacija',
      FOREIGN_PERSONAL:'Devizni lični',
      FOREIGN_BUSINESS:'Devizni poslovni',
    };
    return labels[account.subtype] ?? account.name;
  }
}




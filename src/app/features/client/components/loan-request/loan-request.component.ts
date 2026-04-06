import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NavbarComponent } from 'src/app/shared/components/navbar/navbar.component';
import { LoanService } from '../../services/loan.service';
import { AccountService } from '../../services/account.service';
import { LoanRequestDto, LoanRequestResponse } from '../../models/loan.model';
import { Account } from '../../models/account.model';

/**
 * Enumeracija za vrste kredita
 */
export enum LoanTypeOption {
  PERSONAL = 'PERSONAL',      // Gotovinski
  MORTGAGE = 'MORTGAGE',      // Stambeni
  AUTO = 'AUTO',              // Auto
  REFINANCING = 'REFINANCING', // Refinansirajući
  STUDENT = 'STUDENT'         // Studentski
}

/**
 * Labele za vrste kredita
 */
export const LoanTypeLabels: Record<LoanTypeOption, string> = {
  [LoanTypeOption.PERSONAL]: 'Gotovinski',
  [LoanTypeOption.MORTGAGE]: 'Stambeni',
  [LoanTypeOption.AUTO]: 'Auto',
  [LoanTypeOption.REFINANCING]: 'Refinansirajući',
  [LoanTypeOption.STUDENT]: 'Studentski'
};

/**
 * Enumeracija za tip kamatne stope
 */
export enum InterestRateType {
  FIXED = 'FIXED',       // Fiksna
  VARIABLE = 'VARIABLE'  // Varijabilna
}

/**
 * Labele za tip kamatne stope
 */
export const InterestRateTypeLabels: Record<InterestRateType, string> = {
  [InterestRateType.FIXED]: 'Fiksna',
  [InterestRateType.VARIABLE]: 'Varijabilna'
};

/**
 * Enumeracija za valute
 */
export enum Currency {
  RSD = 'RSD',
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
  CHF = 'CHF'
}

/**
 * Periodi otplate za različite vrste kredita (u mesecima)
 */
export const LoanRepaymentTerms: Record<LoanTypeOption, number[]> = {
  [LoanTypeOption.PERSONAL]: [12, 24, 36, 48, 60, 72, 84],
  [LoanTypeOption.AUTO]: [12, 24, 36, 48, 60, 72, 84],
  [LoanTypeOption.MORTGAGE]: [60, 120, 180, 240, 300, 360],
  [LoanTypeOption.STUDENT]: [12, 24, 36, 48, 60, 72, 84],
  [LoanTypeOption.REFINANCING]: [12, 24, 36, 48, 60, 72, 84]
};

/**
 * Enumeracija za status zaposlenja
 */
export enum EmploymentStatus {
  PERMANENT = 'PERMANENT',   // Stalno
  TEMPORARY = 'TEMPORARY',   // Privremeno
  UNEMPLOYED = 'UNEMPLOYED'  // Nezaposlen
}

/**
 * Labele za status zaposlenja
 */
export const EmploymentStatusLabels: Record<EmploymentStatus, string> = {
  [EmploymentStatus.PERMANENT]: 'Stalno',
  [EmploymentStatus.TEMPORARY]: 'Privremeno',
  [EmploymentStatus.UNEMPLOYED]: 'Nezaposlen'
};

interface SelectOption<T> {
  value: T;
  label: string;
}

@Component({
  selector: 'app-loan-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './loan-request.component.html',
  styleUrls: ['./loan-request.component.scss']
})
export class LoanRequestComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  submitted = false;
  isSubmitting = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  loanResponse: LoanRequestResponse | null = null;

  // Opcije za dropdowns
  loanTypeOptions: SelectOption<LoanTypeOption>[] = [
    { value: LoanTypeOption.PERSONAL, label: LoanTypeLabels[LoanTypeOption.PERSONAL] },
    { value: LoanTypeOption.MORTGAGE, label: LoanTypeLabels[LoanTypeOption.MORTGAGE] },
    { value: LoanTypeOption.AUTO, label: LoanTypeLabels[LoanTypeOption.AUTO] },
    { value: LoanTypeOption.REFINANCING, label: LoanTypeLabels[LoanTypeOption.REFINANCING] },
    { value: LoanTypeOption.STUDENT, label: LoanTypeLabels[LoanTypeOption.STUDENT] }
  ];

  interestRateOptions: SelectOption<InterestRateType>[] = [
    { value: InterestRateType.FIXED, label: InterestRateTypeLabels[InterestRateType.FIXED] },
    { value: InterestRateType.VARIABLE, label: InterestRateTypeLabels[InterestRateType.VARIABLE] }
  ];

  currencyOptions: SelectOption<Currency>[] = [
    { value: Currency.RSD, label: 'RSD - Srpski dinar' },
    { value: Currency.EUR, label: 'EUR - Evro' },
    { value: Currency.USD, label: 'USD - američki dolar' },
    { value: Currency.GBP, label: 'GBP - britanska funta' },
    { value: Currency.CHF, label: 'CHF - švajcarski franak' }
  ];

  employmentStatusOptions: SelectOption<EmploymentStatus>[] = [
    { value: EmploymentStatus.PERMANENT, label: EmploymentStatusLabels[EmploymentStatus.PERMANENT] },
    { value: EmploymentStatus.TEMPORARY, label: EmploymentStatusLabels[EmploymentStatus.TEMPORARY] },
    { value: EmploymentStatus.UNEMPLOYED, label: EmploymentStatusLabels[EmploymentStatus.UNEMPLOYED] }
  ];

  // Dinamičke vrednosti
  repaymentTermOptions: number[] = [];
  accounts: Account[] = [];
  filteredAccounts: Account[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly loanService: LoanService,
    private readonly accountService: AccountService,
    private readonly router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.setupLoanTypeListener();
    this.setupCurrencyListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicijalizuj formu sa svim poljima
   */
  private initializeForm(): void {
    this.form = this.fb.group({
      // Sekcija 1: Vrsta i iznos
      loanType: [null, Validators.required],
      interestRateType: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(100)]],
      currency: [Currency.RSD, Validators.required],
      repaymentPeriod: [null, Validators.required],

      // Sekcija 2: Finansijski podaci
      purpose: ['', Validators.required],
      monthlyIncome: [null, [Validators.required, Validators.min(1)]],
      employmentStatus: [null, Validators.required],
      employmentPeriod: [null, [Validators.required, Validators.min(0)]],

      // Sekcija 3: Račun i kontakt
      accountNumber: ['', Validators.required],
      contactPhone: ['', [Validators.required, Validators.pattern(/^[0-9\-\+\s\(\)]+$/)]]
    });
  }

  /**
   * Učitaj račune iz servisa
   */
  private loadAccounts(): void {
    this.accountService
      .getMyAccounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (accounts) => {
          this.accounts = accounts;
          this.filterAccountsByCurrency();
        },
        error: (err) => {
          console.error('Error loading accounts:', err);
          this.errorMessage = 'Greška pri učitavanju računa. Molimo pokušajte ponovo.';
        }
      });
  }

  /**
   * Postavi listener na promene tipa kredita
   */
  private setupLoanTypeListener(): void {
    this.form
      .get('loanType')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((loanType) => {
        if (loanType) {
          this.updateRepaymentTerms(loanType);
          // Resetuj period otplate
          this.form.get('repaymentPeriod')?.reset();
        }
      });
  }

  /**
   * Postavi listener na promene valute
   */
  private setupCurrencyListener(): void {
    this.form
      .get('currency')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterAccountsByCurrency();
        // Resetuj izabranu račun
        this.form.get('accountNumber')?.reset();
      });
  }

  /**
   * Ažuriraj periode otplate na osnovu tipa kredita
   */
  private updateRepaymentTerms(loanType: LoanTypeOption): void {
    const terms = LoanRepaymentTerms[loanType] || [];
    this.repaymentTermOptions = terms;
  }

  /**
   * Filtriraj račune po izabranoj valuti
   */
  private filterAccountsByCurrency(): void {
    const selectedCurrency = this.form.get('currency')?.value;
    if (selectedCurrency) {
      this.filteredAccounts = this.accounts.filter(
        (account) => account.currency === selectedCurrency && account.status === 'ACTIVE'
      );
    } else {
      this.filteredAccounts = [];
    }
  }

  /**
   * Validacija polja
   */
  isInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted));
  }

  /**
   * Get error message za polje
   */
  getErrorMessage(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return 'Ovo polje je obavezno.';
    }
    if (field.errors['min']) {
      return `Minimalna vrednost je ${field.errors['min'].min}.`;
    }
    if (field.errors['pattern']) {
      return 'Format nije validan.';
    }

    return 'Polje nije validno.';
  }

  /**
   * Podnesi formu
   */
  submit(): void {
    this.submitted = true;
    this.successMessage = null;
    this.errorMessage = null;

    if (this.form.invalid) {
      this.errorMessage = 'Molimo popunite sva obavezna polja ispravno.';
      return;
    }

    this.isSubmitting = true;

    const loanRequestDto: LoanRequestDto = {
      loanType: this.form.get('loanType')?.value,
      interestRateType: this.form.get('interestRateType')?.value,
      amount: this.form.get('amount')?.value,
      currency: this.form.get('currency')?.value,
      repaymentPeriod: this.form.get('repaymentPeriod')?.value,
      purpose: this.form.get('purpose')?.value,
      monthlyIncome: this.form.get('monthlyIncome')?.value,
      employmentStatus: this.form.get('employmentStatus')?.value,
      employmentPeriod: this.form.get('employmentPeriod')?.value,
      accountNumber: this.form.get('accountNumber')?.value,
      contactPhone: this.form.get('contactPhone')?.value
    };

    this.loanService
      .requestLoan(loanRequestDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.loanResponse = response;
          this.successMessage = `Zahtev je uspešno podnet! Broj zahteva: ${response.requestNumber}`;
          this.form.reset({ currency: Currency.RSD });
          this.submitted = false;

          // Preusmeri nakon 3 sekunde
          setTimeout(() => {
            this.router.navigate(['/home/loans']);
          }, 3000);
        },
        error: (err) => {
          console.error('Error submitting loan request:', err);
          this.isSubmitting = false;
          this.errorMessage = err.error?.message || 'Greška pri podnošenju zahteva. Molimo pokušajte ponovo.';
        }
      });
  }

  /**
   * Otkaži formu
   */
  cancel(): void {
    this.router.navigate(['/loans']);
  }

  /**
   * Trackby funkcije za *ngFor
   */
  trackByLoanType = (index: number, item: SelectOption<LoanTypeOption>) => item.value;
  trackByInterestRate = (index: number, item: SelectOption<InterestRateType>) => item.value;
  trackByCurrency = (index: number, item: SelectOption<Currency>) => item.value;
  trackByEmploymentStatus = (index: number, item: SelectOption<EmploymentStatus>) => item.value;
  trackByRepaymentTerm = (index: number, term: number) => term;
  trackByAccount = (index: number, account: Account) => account.id;
}


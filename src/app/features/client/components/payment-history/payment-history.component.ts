import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { PaymentService } from '../../services/payment.service';
import { Payment, PaymentFilters, PaymentStatus } from '../../models/payment.model';
import { TransactionDetailModalComponent } from '../../modals/transaction-detail-modal/transaction-detail-modal.component';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, TransactionDetailModalComponent],
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.scss']
})
export class PaymentHistoryComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  payments: Payment[] = [];
  isLoading = false;
  errorMessage = '';

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  filters: PaymentFilters = {
    dateFrom: '',
    dateTo: '',
    amountFrom: undefined,
    amountTo: undefined,
    status: '',
    type: 'DOMESTIC'
  };

  draftFilters: PaymentFilters = {
    dateFrom: '',
    dateTo: '',
    amountFrom: undefined,
    amountTo: undefined,
    status: '',
    type: 'DOMESTIC'
  };

  activeTab: 'domestic' | 'transfers' = 'domestic';
  isFilterOpen = false;

  selectedPayment: Payment | null = null;
  isDetailsModalOpen = false;

  statusOptions: { value: PaymentStatus | ''; label: string }[] = [
    { value: '', label: 'Svi statusi' },
    { value: 'REALIZED', label: 'Realizovano' },
    { value: 'PROCESSING', label: 'U obradi' },
    { value: 'REJECTED', label: 'Odbijeno' }
  ];

  constructor(private readonly paymentService: PaymentService) {}

  public ngOnInit(): void {
    this.syncDraftFilters();
    this.loadPayments();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public loadPayments(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.paymentService
      .getPayments(this.filters, this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.payments = page.content;
          this.totalElements = page.totalElements;
          this.totalPages = page.totalPages;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Greška pri učitavanju plaćanja:', error);
          this.errorMessage = 'Došlo je do greške pri učitavanju plaćanja.';
          this.isLoading = false;
        }
      });
  }

  public toggleFilterPanel(): void {
    this.isFilterOpen = !this.isFilterOpen;

    if (this.isFilterOpen) {
      this.syncDraftFilters();
    }
  }

  public closeFilterPanel(): void {
    this.isFilterOpen = false;
  }

  public applyFilters(): void {
    this.filters = {
      ...this.draftFilters,
      type: this.activeTab === 'domestic' ? 'DOMESTIC' : 'TRANSFER'
    };

    this.currentPage = 0;
    this.loadPayments();
    this.closeFilterPanel();
  }

  public clearFilters(): void {
    this.filters = {
      dateFrom: '',
      dateTo: '',
      amountFrom: undefined,
      amountTo: undefined,
      status: '',
      type: this.activeTab === 'domestic' ? 'DOMESTIC' : 'TRANSFER'
    };

    this.syncDraftFilters();
    this.currentPage = 0;
    this.loadPayments();
    this.closeFilterPanel();
  }

  public goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadPayments();
    }
  }

  public setActiveTab(tab: 'domestic' | 'transfers'): void {
    this.activeTab = tab;
    this.filters.type = tab === 'domestic' ? 'DOMESTIC' : 'TRANSFER';
    this.draftFilters.type = this.filters.type;
    this.currentPage = 0;
    this.loadPayments();
  }

  public openTransactionDetails(payment: Payment): void {
    this.selectedPayment = payment;
    this.isDetailsModalOpen = true;
  }

  public closeTransactionDetails(): void {
    this.isDetailsModalOpen = false;
    this.selectedPayment = null;
  }

  public formatDate(dateStr: string): string {
    const date = new Date(dateStr);

    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  public formatAmount(amount: number): string {
    const prefix = amount >= 0 ? '+' : '';

    return prefix + new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  public getStatusClass(status: PaymentStatus): string {
    switch (status) {
      case 'REALIZED':
        return 'status--realized';
      case 'PROCESSING':
        return 'status--processing';
      case 'REJECTED':
        return 'status--rejected';
      default:
        return '';
    }
  }

  public getStatusLabel(status: PaymentStatus): string {
    switch (status) {
      case 'REALIZED':
        return 'REALIZOVANO';
      case 'PROCESSING':
        return 'U OBRADI';
      case 'REJECTED':
        return 'ODBIJENO';
      default:
        return status;
    }
  }

  public getLastItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  public trackByPaymentId(index: number, payment: Payment): number {
    return payment.id;
  }

  private syncDraftFilters(): void {
    this.draftFilters = {
      ...this.filters
    };
  }
}

import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SecuritiesService } from '../../services/securities.service';
import {
  Stock,
  PriceHistory,
  OptionChain,
  StockOption,
} from '../../models/security.model';

type Period = 'day' | 'week' | 'month' | 'year' | '5year' | 'all';

interface DetailRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './stock-detail.component.html',
  styleUrls: ['./stock-detail.component.scss'],
})
export class StockDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly destroy$ = new Subject<void>();

  ticker = '';
  stock: Stock | null = null;
  priceHistory: PriceHistory | null = null;
  optionChain: OptionChain | null = null;

  isLoading = true;
  errorMessage = '';

  selectedPeriod: Period = 'month';
  periods: { value: Period; label: string }[] = [
    { value: 'day', label: 'Dan' },
    { value: 'week', label: 'Nedelja' },
    { value: 'month', label: 'Mesec' },
    { value: 'year', label: 'Godina' },
    { value: '5year', label: '5 God' },
    { value: 'all', label: 'Početak' },
  ];

  detailRows: DetailRow[] = [];

  // Options
  settlementDates: string[] = [];
  selectedSettlementDate = '';
  strikeCount = 10;
  displayedCalls: StockOption[] = [];
  displayedPuts: StockOption[] = [];
  displayedStrikes: number[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly securitiesService: SecuritiesService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.ticker = params['ticker'];
      this.loadStock();
    });
  }

  ngAfterViewInit(): void {
    // Chart will be drawn after data is loaded
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStock(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.securitiesService
      .getStockById(+this.ticker)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stock) => {
          this.stock = stock;
          this.buildDetailRows();
          this.loadPriceHistory();
          this.loadSettlementDates();
        },
        error: (err) => {
          console.error('Error loading stock:', err);
          this.errorMessage = 'Greška pri učitavanju akcije.';
          this.isLoading = false;
        },
      });
  }

  loadPriceHistory(): void {
    this.securitiesService
      .getPriceHistory(this.ticker, this.selectedPeriod)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.priceHistory = history;
          this.isLoading = false;
          setTimeout(() => this.drawChart(), 0);
        },
        error: (err) => {
          console.error('Error loading price history:', err);
          this.isLoading = false;
        },
      });
  }

  loadSettlementDates(): void {
    if (!this.stock) return;

    this.securitiesService
      .getOptionSettlementDates(this.stock.id.toString())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dates) => {
          this.settlementDates = dates;
          if (dates.length > 0) {
            this.selectedSettlementDate = dates[0];
            this.loadOptionChain();
          }
        },
        error: (err) => {
          console.error('Error loading settlement dates:', err);
        },
      });
  }

  loadOptionChain(): void {
    if (!this.selectedSettlementDate || !this.stock) return;

    this.securitiesService
      .getOptionChain(this.stock.id.toString(), this.selectedSettlementDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (chain) => {
          this.optionChain = chain;
          this.updateDisplayedOptions();
        },
        error: (err) => {
          console.error('Error loading option chain:', err);
        },
      });
  }

  onSettlementDateChange(): void {
    this.loadOptionChain();
  }

  onStrikeCountChange(): void {
    this.updateDisplayedOptions();
  }

  updateDisplayedOptions(): void {
    if (!this.optionChain) return;

    const count = Math.min(this.strikeCount, this.optionChain.strikes.length);
    const startIndex = Math.floor((this.optionChain.strikes.length - count) / 2);

    this.displayedStrikes = this.optionChain.strikes.slice(startIndex, startIndex + count);

    this.displayedCalls = this.optionChain.calls.filter((c) =>
      this.displayedStrikes.includes(c.strike)
    );
    this.displayedPuts = this.optionChain.puts.filter((p) =>
      this.displayedStrikes.includes(p.strike)
    );
  }

  selectPeriod(period: Period): void {
    this.selectedPeriod = period;
    this.loadPriceHistory();
  }

  buildDetailRows(): void {
    if (!this.stock) return;

    this.detailRows = [
      { label: 'Otvaranje', value: this.formatPrice(this.stock.open) },
      { label: 'Najviša', value: this.formatPrice(this.stock.high) },
      { label: 'Najniža', value: this.formatPrice(this.stock.low) },
      { label: 'Prethodno zatvaranje', value: this.formatPrice(this.stock.previousClose) },
    ];

    if (this.stock.marketCap) {
      this.detailRows.push({
        label: 'Tržišna kapitalizacija',
        value: this.formatLargeNumber(this.stock.marketCap),
      });
    }
    if (this.stock.pe) {
      this.detailRows.push({ label: 'P/E odnos', value: this.stock.pe.toFixed(2) });
    }
    if (this.stock.dividend) {
      this.detailRows.push({
        label: 'Dividenda',
        value: `${this.formatPrice(this.stock.dividend)} (${this.stock.dividendYield?.toFixed(2)}%)`,
      });
    }
  }

  drawChart(): void {
    if (!this.chartCanvas || !this.priceHistory?.data?.length) return;

    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const data = this.priceHistory.data;
    const padding = 40;
    const width = rect.width;
    const height = rect.height;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find min/max prices
    const prices = data.map((d) => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Price labels
      const price = maxPrice - (priceRange / 4) * i;
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), padding - 5, y + 4);
    }

    const xStep = data.length > 1 ? chartWidth / (data.length - 1) : 0;
    const getX = (i: number) => data.length === 1 ? padding + chartWidth / 2 : padding + xStep * i;
    const getY = (price: number) => data.length === 1
      ? padding + chartHeight / 2
      : padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

    if (data.length === 1) {
      // Draw a single dot
      const x = getX(0);
      const y = getY(data[0].price);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#16a34a';
      ctx.fill();
    } else {
      // Draw line chart
      ctx.beginPath();
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';

      data.forEach((point, index) => {
        const x = getX(index);
        const y = getY(point.price);
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });

      ctx.stroke();

      // Fill area under line
      ctx.lineTo(getX(data.length - 1), height - padding);
      ctx.lineTo(padding, height - padding);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
      gradient.addColorStop(0, 'rgba(22, 163, 74, 0.3)');
      gradient.addColorStop(1, 'rgba(22, 163, 74, 0.05)');
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw date labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';

    const labelCount = Math.min(5, data.length);
    for (let i = 0; i < labelCount; i++) {
      const dataIndex = labelCount > 1 ? Math.floor((i / (labelCount - 1)) * (data.length - 1)) : 0;
      const x = getX(dataIndex);
      const date = new Date(data[dataIndex].date);
      const label = date.toLocaleDateString('sr-RS', { month: 'short', year: '2-digit' });
      ctx.fillText(label, x, height - padding + 15);
    }
  }

  getCallByStrike(strike: number): StockOption | undefined {
    return this.displayedCalls.find((c) => c.strike === strike);
  }

  getPutByStrike(strike: number): StockOption | undefined {
    return this.displayedPuts.find((p) => p.strike === strike);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  formatVolume(volume: number): string {
    return new Intl.NumberFormat('sr-RS').format(volume);
  }

  formatLargeNumber(num: number): string {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toString();
  }

  formatChange(change: number, changePercent: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  }

  getChangeClass(change: number): string {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  }

  formatOptionPrice(price: number): string {
    return price.toFixed(2);
  }

  goBack(): void {
    this.router.navigate(['/securities']);
  }

  trackByStrike(index: number, strike: number): number {
    return strike;
  }
}

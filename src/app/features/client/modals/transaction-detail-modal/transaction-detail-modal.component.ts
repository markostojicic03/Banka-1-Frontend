import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import { Payment } from '../../models/payment.model';

@Component({
  selector: 'app-transaction-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-detail-modal.component.html',
  styleUrls: ['./transaction-detail-modal.component.scss']
})
export class TransactionDetailModalComponent {
  @Input() public payment: Payment | null = null;
  @Output() public close = new EventEmitter<void>();

  public closeModal(): void {
    this.close.emit();
  }

  public formatAmount(amount: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  public formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);

    return date.toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Generiše PDF potvrdu sa svim detaljima transakcije
   * i automatski pokreće download fajla.
   */
  public async printReceipt(): Promise<void> {
    if (!this.payment) {
      return;
    }

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    await this.ensurePdfFonts(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const left = 20;
    const right = pageWidth - 20;
    let y = 20;

    const payment = this.payment;

    // Header
    doc.setFillColor(20, 83, 45);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('Potvrda o transakciji', left, 18);

    y = 40;

    doc.setTextColor(30, 41, 59);
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(18);
    doc.text('Detalji plaćanja', left, y);

    y += 10;

    const addSectionTitle = (title: string): void => {
      doc.setFont('NotoSans', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(title, left, y);

      y += 5;

      doc.setDrawColor(226, 232, 240);
      doc.line(left, y, right, y);

      y += 8;
    };

    const addField = (label: string, value: string): void => {
      doc.setFont('NotoSans', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(label, left, y);

      doc.setFont('NotoSans', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      const wrappedValue = doc.splitTextToSize(value || '-', 100);
      doc.text(wrappedValue, right, y, { align: 'right' });

      const lineCount = Array.isArray(wrappedValue) ? wrappedValue.length : 1;
      y += 7 + (lineCount - 1) * 5;
    };

    // Osnovni podaci
    addSectionTitle('Osnovni podaci');
    addField('Broj naloga', payment.orderNumber);
    addField('Primalac', payment.recipientName);
    addField('Datum i vreme', this.formatTimestamp(payment.timestamp));
    addField('Status', this.getStatusLabel(payment.status));
    addField('Tip transakcije', this.getTypeLabel(payment.type));
    addField('Svrha plaćanja', payment.purpose || '-');

    y += 4;

    // Finansijski podaci
    addSectionTitle('Finansijski podaci');
    addField('Početni iznos', `${this.formatAmount(payment.initialAmount)} ${payment.currency}`);
    addField('Provizija', `${this.formatAmount(payment.fee)} ${payment.currency}`);
    addField('Krajnji iznos', `${this.formatAmount(payment.finalAmount)} ${payment.currency}`);

    y += 4;

    // Računi i poziv
    addSectionTitle('Računi i poziv');
    addField('Sa računa', payment.payerAccountNumber);
    addField('Na račun', payment.recipientAccountNumber);
    addField('Šifra plaćanja', payment.paymentCode || '-');
    addField('Poziv na broj', payment.referenceNumber || '-');

    y += 8;

    doc.setDrawColor(226, 232, 240);
    doc.line(left, y, right, y);

    y += 10;

    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Ova potvrda je generisana elektronski i važi bez potpisa i pečata.',
      left,
      y
    );

    y += 6;

    doc.text(
      `Generisano: ${new Date().toLocaleString('sr-RS')}`,
      left,
      y
    );

    const safeOrderNumber = payment.orderNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
    doc.save(`potvrda-transakcije-${safeOrderNumber}.pdf`);
  }

  private getStatusLabel(status: string): string {
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

  private getTypeLabel(type: string): string {
    switch (type) {
      case 'DOMESTIC':
        return 'Domaće plaćanje';
      case 'TRANSFER':
        return 'Transfer';
      default:
        return type;
    }
  }

  private async loadImageAsBase64(path: string): Promise<string | null> {
    try {
      const response = await fetch(path);
      const blob = await response.blob();

      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  private fontsInitialized = false;

  private async loadBinaryAsset(path: string): Promise<string> {
    const response = await fetch(path);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    let binary = '';
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }

    return binary;
  }

  private async ensurePdfFonts(doc: jsPDF): Promise<void> {
    if (this.fontsInitialized) {
      return;
    }

    const regularFont = await this.loadBinaryAsset('assets/fonts/NotoSans-Regular.ttf');
    const boldFont = await this.loadBinaryAsset('assets/fonts/NotoSans-Bold.ttf');

    doc.addFileToVFS('NotoSans-Regular.ttf', regularFont);
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');

    doc.addFileToVFS('NotoSans-Bold.ttf', boldFont);
    doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');

    this.fontsInitialized = true;
  }
}

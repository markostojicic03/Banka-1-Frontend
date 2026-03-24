import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from './../../../../environments/environment';
import { Payment, PaymentPage, PaymentFilters } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly baseUrl = `${environment.apiUrl}/payments`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Dohvata listu plaćanja sa filterima i paginacijom.
   * Trenutno koristi mock podatke dok backend ne bude spreman.
   */
  public getPayments(
    filters: PaymentFilters = {},
    page = 0,
    size = 10
  ): Observable<PaymentPage> {
    // TODO: Kada backend bude spreman, ukloniti mock deo i koristiti pravi API poziv.
    //
    // let params = new HttpParams()
    //   .set('page', page.toString())
    //   .set('size', size.toString());
    //
    // if (filters.dateFrom) {
    //   params = params.set('dateFrom', filters.dateFrom);
    // }
    // if (filters.dateTo) {
    //   params = params.set('dateTo', filters.dateTo);
    // }
    // if (filters.amountFrom !== undefined) {
    //   params = params.set('amountFrom', filters.amountFrom.toString());
    // }
    // if (filters.amountTo !== undefined) {
    //   params = params.set('amountTo', filters.amountTo.toString());
    // }
    // if (filters.status) {
    //   params = params.set('status', filters.status);
    // }
    // if (filters.type) {
    //   params = params.set('type', filters.type);
    // }
    //
    // return this.http.get<PaymentPage>(this.baseUrl, { params });

    return this.getMockPayments(filters, page, size);
  }

  private getMockPayments(
    filters: PaymentFilters,
    page: number,
    size: number
  ): Observable<PaymentPage> {
    const allPayments: Payment[] = [
      {
        id: 1,
        date: '2026-03-03',
        timestamp: '2026-03-03T10:42:15',
        orderNumber: 'NAL-2026-000001',
        payerName: 'Interni prenos',
        recipientName: 'Nikola Ilibasic',
        payerAccountNumber: '265-0000000012345-89',
        recipientAccountNumber: '265-0000000054321-12',
        currency: 'RSD',
        amount: 3000.00,
        initialAmount: 3000.00,
        finalAmount: 3000.00,
        fee: 0,
        status: 'REALIZED',
        type: 'TRANSFER',
        purpose: 'Prenos sredstava',
        referenceNumber: '97 20260001',
        paymentCode: '289'
      },
      {
        id: 2,
        date: '2026-03-01',
        timestamp: '2026-03-01T14:10:28',
        orderNumber: 'NAL-2026-000002',
        payerName: 'Maja Nikolić',
        recipientName: 'Maja Nikolić',
        payerAccountNumber: '265-0000000012345-89',
        recipientAccountNumber: '170-0000000098765-43',
        currency: 'RSD',
        amount: -2000.00,
        initialAmount: 2000.00,
        finalAmount: 2000.00,
        fee: 0,
        status: 'REJECTED',
        type: 'DOMESTIC',
        purpose: 'Uplata za usluge',
        referenceNumber: '00 123-45',
        paymentCode: '221'
      },
      {
        id: 3,
        date: '2026-03-01',
        timestamp: '2026-03-01T08:25:03',
        orderNumber: 'NAL-2026-000003',
        payerName: 'Mama',
        recipientName: 'Nikola Ilibasic',
        payerAccountNumber: '160-0000000111222-33',
        recipientAccountNumber: '265-0000000012345-89',
        currency: 'RSD',
        amount: 2787.00,
        initialAmount: 2787.00,
        finalAmount: 2787.00,
        fee: 0,
        status: 'PROCESSING',
        type: 'DOMESTIC',
        purpose: 'Poklon',
        referenceNumber: '00 000003',
        paymentCode: '189'
      },
      {
        id: 4,
        date: '2026-02-28',
        timestamp: '2026-02-28T18:14:55',
        orderNumber: 'NAL-2026-000004',
        payerName: 'Interni prenos',
        recipientName: 'Nikola Ilibasic',
        payerAccountNumber: '265-0000000012345-89',
        recipientAccountNumber: '265-0000000054321-12',
        currency: 'RSD',
        amount: 50000.00,
        initialAmount: 50000.00,
        finalAmount: 50000.00,
        fee: 0,
        status: 'PROCESSING',
        type: 'TRANSFER',
        purpose: 'Prenos na štednju',
        referenceNumber: '97 20260004',
        paymentCode: '289'
      },
      {
        id: 5,
        date: '2026-02-25',
        timestamp: '2026-02-25T11:02:44',
        orderNumber: 'NAL-2026-000005',
        payerName: 'Petar Petrović',
        recipientName: 'Nikola Ilibasic',
        payerAccountNumber: '205-0000000333444-55',
        recipientAccountNumber: '265-0000000012345-89',
        currency: 'RSD',
        amount: 15000.00,
        initialAmount: 15000.00,
        finalAmount: 15000.00,
        fee: 0,
        status: 'REALIZED',
        type: 'DOMESTIC',
        purpose: 'Vraćanje duga',
        referenceNumber: '00 15000',
        paymentCode: '189'
      },
      {
        id: 6,
        date: '2026-02-20',
        timestamp: '2026-02-20T09:45:12',
        orderNumber: 'NAL-2026-000006',
        payerName: 'EPS Srbija',
        recipientName: 'EPS Srbija',
        payerAccountNumber: '265-0000000012345-89',
        recipientAccountNumber: '840-0000000000001-23',
        currency: 'RSD',
        amount: -4500.00,
        initialAmount: 4500.00,
        finalAmount: 4525.00,
        fee: 25.00,
        status: 'REALIZED',
        type: 'DOMESTIC',
        purpose: 'Račun za struju - februar 2026',
        referenceNumber: '97 4500-2026',
        paymentCode: '289'
      },
      {
        id: 7,
        date: '2026-02-15',
        timestamp: '2026-02-15T16:30:00',
        orderNumber: 'NAL-2026-000007',
        payerName: 'Telenor Srbija',
        recipientName: 'Telenor Srbija',
        payerAccountNumber: '265-0000000012345-89',
        recipientAccountNumber: '160-0000000555666-77',
        currency: 'RSD',
        amount: -2199.00,
        initialAmount: 2199.00,
        finalAmount: 2214.00,
        fee: 15.00,
        status: 'REALIZED',
        type: 'DOMESTIC',
        purpose: 'Telefonski račun',
        referenceNumber: '00 2199',
        paymentCode: '289'
      },
      {
        id: 8,
        date: '2026-02-10',
        timestamp: '2026-02-10T13:05:40',
        orderNumber: 'NAL-2026-000008',
        payerName: 'Marko Marković',
        recipientName: 'Marko Marković',
        payerAccountNumber: '265-0000000012345-89',
        recipientAccountNumber: '325-0000000777888-99',
        currency: 'RSD',
        amount: -8000.00,
        initialAmount: 8000.00,
        finalAmount: 8030.00,
        fee: 30.00,
        status: 'REJECTED',
        type: 'DOMESTIC',
        purpose: 'Pozajmica',
        referenceNumber: '00 8000',
        paymentCode: '221'
      },
      {
        id: 9,
        date: '2026-02-05',
        timestamp: '2026-02-05T07:58:21',
        orderNumber: 'NAL-2026-000009',
        payerName: 'Poslodavac DOO',
        recipientName: 'Nikola Ilibasic',
        payerAccountNumber: '170-0000000123456-78',
        recipientAccountNumber: '265-0000000012345-89',
        currency: 'RSD',
        amount: 95000.00,
        initialAmount: 95000.00,
        finalAmount: 95000.00,
        fee: 0,
        status: 'REALIZED',
        type: 'DOMESTIC',
        purpose: 'Plata - januar 2026',
        referenceNumber: '00 95000',
        paymentCode: '189'
      },
      {
        id: 10,
        date: '2026-01-28',
        timestamp: '2026-01-28T12:12:12',
        orderNumber: 'NAL-2026-000010',
        payerName: 'Interni prenos',
        recipientName: 'Nikola Ilibasic',
        payerAccountNumber: '265-0000000054321-12',
        recipientAccountNumber: '265-0000000012345-89',
        currency: 'RSD',
        amount: 10000.00,
        initialAmount: 10000.00,
        finalAmount: 10000.00,
        fee: 0,
        status: 'REALIZED',
        type: 'TRANSFER',
        purpose: 'Podizanje sa štednje',
        referenceNumber: '97 20260010',
        paymentCode: '289'
      }
    ];

    let filtered = [...allPayments];

    if (filters.type) {
      filtered = filtered.filter(payment => payment.type === filters.type);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(payment => payment.date >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(payment => payment.date <= filters.dateTo!);
    }

    if (filters.amountFrom !== undefined && filters.amountFrom !== null) {
      filtered = filtered.filter(payment => Math.abs(payment.amount) >= filters.amountFrom!);
    }

    if (filters.amountTo !== undefined && filters.amountTo !== null) {
      filtered = filtered.filter(payment => Math.abs(payment.amount) <= filters.amountTo!);
    }

    if (filters.status) {
      filtered = filtered.filter(payment => payment.status === filters.status);
    }

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

    const response: PaymentPage = {
      content,
      totalElements,
      totalPages,
      number: page,
      size
    };

    return of(response).pipe(delay(300));
  }

  public getPaymentById(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/${id}`);
  }
}

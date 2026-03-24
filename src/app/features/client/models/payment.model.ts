export type PaymentStatus = 'REALIZED' | 'PROCESSING' | 'REJECTED';
export type PaymentType = 'DOMESTIC' | 'TRANSFER';

export interface Payment {
  id: number;

  /** Datum za listu */
  date: string;

  /** Pun timestamp za detalje */
  timestamp: string;

  /** Broj naloga */
  orderNumber: string;

  /** Naziv platioca za prikaz u listi */
  payerName: string;

  /** Primalac */
  recipientName: string;

  /** Sa računa */
  payerAccountNumber: string;

  /** Na račun */
  recipientAccountNumber: string;

  /** Valuta */
  currency: string;

  /** Iznos za prikaz u listi */
  amount: number;

  /** Početni iznos */
  initialAmount: number;

  /** Krajnji iznos */
  finalAmount: number;

  /** Provizija */
  fee: number;

  /** Status */
  status: PaymentStatus;

  /** Tip transakcije */
  type: PaymentType;

  /** Svrha plaćanja */
  purpose?: string;

  /** Poziv na broj */
  referenceNumber?: string;

  /** Šifra plaćanja */
  paymentCode?: string;
}

export interface PaymentPage {
  content: Payment[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PaymentFilters {
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  status?: PaymentStatus | '';
  type?: PaymentType;
}

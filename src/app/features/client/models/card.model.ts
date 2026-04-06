export interface Card {
  id: number;
  cardNumber: string;   // dolazi maskirano sa beka npr. "XXXX-XXXX-XXXX-1234"
  cardType: string;     // "DEBIT", "CREDIT", "PREPAID"
  status: string;       // "ACTIVE", "BLOCKED", "EXPIRED", "CANCELLED"
  expiryDate: string;   // "MM/YY"
  accountNumber: string;
  // dodajemo lokalno iz AccountResponseDto
  accountName?: string;
}

export interface CardPage {
  content: Card[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Card, CardPage } from '../models/card.model';

/**
 * DTO za osnovne podatke o računu klijenta.
 * Mapira odgovor od GET /client/accounts (AccountResponseDto sa beka).
 */
export interface AccountDto {
  nazivRacuna: string;
  brojRacuna: string;
  raspolozivoStanje: number;
  currency: string;
  accountCategory: string;
  accountType: string;
  subtype: string | null;
}

/**
 * DTO za paginiranu listu računa klijenta.
 */
export interface AccountPage {
  content: AccountDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * DTO za detalje računa — koristi se za dohvatanje kartica.
 * Mapira AccountDetailsResponseDto sa beka koji već sadrži listu kartica.
 */
export interface AccountDetailsDto {
  nazivRacuna: string;
  brojRacuna: string;
  cards: Card[];
}

/**
 * Servis za komunikaciju sa backendom vezano za kartice klijenta.
 * <p>
 * Podržava:
 * - Dohvatanje liste računa klijenta
 * - Dohvatanje detalja računa (uključuje kartice)
 * - Blokiranje, deblokiranje i deaktiviranje kartice
 * - Maskiranje broja kartice za prikaz
 */
@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly base = ${environment.apiUrl}/accounts/client;

  constructor(private readonly http: HttpClient) {}

  /**
   * Dohvata paginiranu listu aktivnih računa ulogovanog klijenta.
   * Endpoint: GET /client/accounts
   *
   * @param page broj stranice (0-indeksiran)
   * @param size broj rezultata po stranici
   */
  public getMyAccounts(page = 0, size = 100): Observable<AccountPage> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<AccountPage>(`${this.base}/accounts`, { params });
  }

  /**
   * Dohvata detalje računa po broju računa.
   * AccountDetailsResponseDto već sadrži listu kartica vezanih za račun.
   * Endpoint: GET /client/api/accounts/{accountNumber}
   *
   * @param accountNumber 18-cifreni broj računa
   */
  public getAccountDetails(accountNumber: string): Observable<AccountDetailsDto> {
    return this.http.get<AccountDetailsDto>(`${this.base}/api/accounts/${accountNumber}`);
  }

  /**
   * Blokira karticu klijenta.
   * Klijent može blokirati samo sopstvenu aktivnu karticu.
   * Odblokiranje je moguće samo uz pomoć zaposlenog banke.
   * Endpoint: PATCH /api/cards/{id}/block
   *
   * @param cardId ID kartice koja se blokira
   */
  public blockCard(cardId: number): Observable<void> {
    return this.http.patch<void>(`/api/cards/${cardId}/block`, {});
  }

  /**
   * Deblokira karticu klijenta.
   * Endpoint: PATCH /api/cards/{id}/unblock
   *
   * @param cardId ID kartice koja se deblokira
   */
  public unblockCard(cardId: number): Observable<void> {
    return this.http.patch<void>(`/api/cards/${cardId}/unblock`, {});
  }

  /**
   * Deaktivira karticu klijenta.
   * Napomena: jednom deaktivirana kartica ne može biti reaktivirana.
   * Endpoint: PATCH /api/cards/{id}/deactivate
   *
   * @param cardId ID kartice koja se deaktivira
   */
  public deactivateCard(cardId: number): Observable<void> {
    return this.http.patch<void>(`/api/cards/${cardId}/deactivate`, {});
  }

  /**
   * Maskira broj kartice za bezbedni prikaz korisniku.
   * Format: XXXX **** **** XXXX (prve 4 + 8 zvezdica + zadnje 4 cifre)
   * Primer: "5798123456785571" → "5798 **** **** 5571"
   *
   * @param cardNumber broj kartice (može biti sa ili bez razmaka/crtica)
   */
  public maskCardNumber(cardNumber: string): string {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length >= 8) {
      const first4 = digits.slice(0, 4);
      const last4 = digits.slice(-4);
      return `${first4} **** **** ${last4}`;
    }
    // Fallback za već formatirane brojeve (npr. "XXXX-XXXX-XXXX-1234")
    const parts = cardNumber.split(/[-\s]/);
    if (parts.length === 4) {
      return `${parts[0]} **** **** ${parts[3]}`;
    }
    return cardNumber;
  }
}

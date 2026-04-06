import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { CardService, AccountDto } from '../../services/card.service';
import { Card } from '../../models/card.model';

/**
 * Interfejs za grupisanje kartica po računu.
 * Svaka grupa sadrži naziv i broj računa, kao i listu kartica vezanih za taj račun.
 */
export interface CardGroup {
  accountName: string;
  accountNumber: string;
  cards: Card[];
}

/**
 * Komponenta za prikaz svih kartica ulogovanog klijenta.
 * <p>
 * Prikazuje kartice grupisane po računu za koji su vezane.
 * Za svaku karticu prikazuje:
 * - naziv i vrstu kartice
 * - maskiran broj kartice u formatu: XXXX **** **** XXXX
 * - status badge (Aktivna / Blokirana / Deaktivirana) sa odgovarajućim bojama
 * - akcijska dugmad u zavisnosti od statusa kartice:
 *   - ACTIVE: Blokiraj + Deaktiviraj
 *   - BLOCKED: Deblokiraj + Deaktiviraj
 *   - EXPIRED/CANCELLED: nema akcija
 * <p>
 * Tok učitavanja:
 * 1. Dohvata sve račune klijenta via GET /client/accounts
 * 2. Za svaki račun dohvata detalje via GET /client/api/accounts/{brojRacuna}
 *    koji već sadrži listu kartica u AccountDetailsResponseDto.cards
 * 3. Grupiše kartice po računu za prikaz
 */
@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './card-list.component.html',
  styles: [`:host { display: block; }

  .thumb--blue    { background: linear-gradient(135deg, #667eea, #764ba2); }
  .thumb--purple  { background: linear-gradient(135deg, #a855f7, #6366f1); }
  .thumb--green   { background: linear-gradient(135deg, #22c55e, #16a34a); }
  .thumb--pink    { background: linear-gradient(135deg, #ec4899, #f43f5e); }
  .thumb--indigo  { background: linear-gradient(135deg, #6366f1, #4f46e5); }
  .thumb--teal    { background: linear-gradient(135deg, #14b8a6, #0891b2); }
  .thumb--orange  { background: linear-gradient(135deg, #f97316, #ea580c); }
  .thumb--red     { background: linear-gradient(135deg, #ef4444, #dc2626); }
  .thumb--cyan    { background: linear-gradient(135deg, #06b6d4, #0891b2); }
  .thumb--slate   { background: linear-gradient(135deg, #64748b, #475569); }
  `]
})
export class CardListComponent implements OnInit {

  groupedCards: CardGroup[] = [];
  isLoading = true;
  errorMessage = '';

  // ── Dialog state ─────────────────────────────────────────────
  showBlockDialog = false;
  showUnblockDialog = false;
  showDeactivateDialog = false;

  cardToBlock: Card | null = null;
  cardToUnblock: Card | null = null;
  cardToDeactivate: Card | null = null;

  constructor(private readonly cardService: CardService) {}

  public ngOnInit(): void {
    this.loadAllCards();
  }

  /**
   * Dohvata sve kartice klijenta grupisane po računu.
   * <p>
   * Korak 1: GET /client/accounts — lista računa klijenta (sadrži brojRacuna)
   * Korak 2: GET /client/api/accounts/{brojRacuna} — detalji računa koji
   *          već sadrže listu kartica (AccountDetailsResponseDto.cards)
   * Korak 3: Grupisanje kartica po računu za prikaz u UI
   * <p>
   * Napomena: AccountResponseDto ne sadrži ID računa, pa koristimo brojRacuna
   * kao ključ za dohvatanje detalja — endpoint to podržava.
   */
  public loadAllCards(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.groupedCards = [];

    this.cardService.getMyAccounts().pipe(
      switchMap(accountPage => {
        const accounts = accountPage.content ?? [];
        if (accounts.length === 0) return of([]);

        // Za svaki račun dohvatamo detalje koji uključuju kartice
        const detailRequests = accounts.map((acc: AccountDto) =>
          this.cardService.getAccountDetails(acc.brojRacuna).pipe(
            catchError(() => of(null)),
            switchMap(details => {
              if (!details || !details.cards?.length) return of(null);

              // Mapiramo kartice i dodajemo naziv i broj računa
              const group: CardGroup = {
                accountName: acc.nazivRacuna,
                accountNumber: acc.brojRacuna,
                cards: details.cards.map((card: Card) => ({
                  ...card,
                  accountName: acc.nazivRacuna,
                  accountNumber: acc.brojRacuna
                }))
              };
              return of(group);
            })
          )
        );

        return forkJoin(detailRequests);
      }),
      catchError((err: HttpErrorResponse) => {
        this.errorMessage =
          err.error?.message ||
          err.error?.error ||
          'Greška pri učitavanju kartica. Pokušajte ponovo.';
        this.isLoading = false;
        return of([]);
      })
    ).subscribe({
      next: (results: any) => {
        // Filtriramo null rezultate (računi bez kartica)
        this.groupedCards = (results as (CardGroup | null)[])
          .filter((g): g is CardGroup => g !== null);
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage =
          err.error?.message ||
          err.error?.error ||
          'Greška pri učitavanju kartica. Pokušajte ponovo.';
        this.isLoading = false;
      }
    });
  }

  // ── Akcije — blokiranje ───────────────────────────────────────

  /**
   * Otvara confirmation dialog za blokiranje kartice (F5).
   * Dugme je vidljivo samo za kartice sa statusom ACTIVE.
   */
  public onBlockCard(card: Card): void {
    this.cardToBlock = card;
    this.showBlockDialog = true;
  }

  /**
   * Potvrđuje blokiranje kartice.
   * Nakon uspešnog blokiranja osvežava listu kartica.
   */
  public onConfirmBlock(): void {
    if (!this.cardToBlock) return;
    this.cardService.blockCard(this.cardToBlock.id).subscribe({
      next: () => {
        this.onCancelAction();
        this.loadAllCards();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage =
          err.error?.message || 'Greška pri blokiranju kartice.';
        this.onCancelAction();
      }
    });
  }

  // ── Akcije — deblokiranje ─────────────────────────────────────

  /**
   * Otvara confirmation dialog za deblokiranje kartice.
   * Dugme je vidljivo samo za kartice sa statusom BLOCKED.
   */
  public onUnblockCard(card: Card): void {
    this.cardToUnblock = card;
    this.showUnblockDialog = true;
  }

  /**
   * Potvrđuje deblokiranje kartice.
   * Nakon uspešnog deblokiranja osvežava listu kartica.
   */
  public onConfirmUnblock(): void {
    if (!this.cardToUnblock) return;
    this.cardService.unblockCard(this.cardToUnblock.id).subscribe({
      next: () => {
        this.onCancelAction();
        this.loadAllCards();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage =
          err.error?.message || 'Greška pri deblokiranju kartice.';
        this.onCancelAction();
      }
    });
  }

  // ── Akcije — deaktiviranje ────────────────────────────────────

  /**
   * Otvara confirmation dialog za deaktiviranje kartice.
   * Dugme je vidljivo za kartice sa statusom ACTIVE i BLOCKED.
   * Napomena: jednom deaktivirana kartica ne može biti reaktivirana.
   */
  public onDeactivateCard(card: Card): void {
    this.cardToDeactivate = card;
    this.showDeactivateDialog = true;
  }

  /**
   * Potvrđuje deaktiviranje kartice.
   * Nakon uspešnog deaktiviranja osvežava listu kartica.
   */
  public onConfirmDeactivate(): void {
    if (!this.cardToDeactivate) return;
    this.cardService.deactivateCard(this.cardToDeactivate.id).subscribe({
      next: () => {
        this.onCancelAction();
        this.loadAllCards();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage =
          err.error?.message || 'Greška pri deaktiviranju kartice.';
        this.onCancelAction();
      }
    });
  }

  /**
   * Zatvara sve confirmation dialoge i resetuje stanje.
   */
  public onCancelAction(): void {
    this.showBlockDialog = false;
    this.showUnblockDialog = false;
    this.showDeactivateDialog = false;
    this.cardToBlock = null;
    this.cardToUnblock = null;
    this.cardToDeactivate = null;
  }

  // ── Helpers ───────────────────────────────────────────────────

  /**
   * Maskira broj kartice u format: XXXX **** **** XXXX
   * Primer: "5798123456785571" → "5798 **** **** 5571"
   */
  public maskCardNumber(cardNumber: string): string {
    return this.cardService.maskCardNumber(cardNumber);
  }

  /**
   * Vraća human-readable naziv statusa kartice.
   */
  public getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Aktivna',
      BLOCKED: 'Blokirana',
      EXPIRED: 'Deaktivirana',
      CANCELLED: 'Deaktivirana'
    };
    return map[status] ?? status;
  }

  /**
   * Vraća CSS klasu za status badge na osnovu statusa kartice.
   */
  public getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'z-badge-green',
      BLOCKED: 'z-badge-red',
      EXPIRED: 'z-badge-gray',
      CANCELLED: 'z-badge-gray'
    };
    return map[status] ?? 'z-badge-gray';
  }

  /**
   * Vraća human-readable naziv vrste kartice.
   */
  public getCardTypeLabel(cardType: string): string {
    const map: Record<string, string> = {
      DEBIT: 'Debitna',
      CREDIT: 'Kreditna',
      PREPAID: 'Prepaid'
    };
    return map[cardType] ?? cardType;
  }

  /**
   * Određuje brend kartice na osnovu prvih cifara broja kartice (MII/IIN standard).
   * - Visa: počinje sa 4
   * - Mastercard: počinje sa 51-55 ili 2221-2720
   * - DinaCard: počinje sa 9891
   * - American Express: počinje sa 34 ili 37
   */
  public getCardBrand(card: Card): string {
    const num = card.cardNumber.replace(/\D/g, '');
    if (num.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'MC';
    if (num.startsWith('9891')) return 'DINA';
    if (num.startsWith('34') || num.startsWith('37')) return 'AMEX';
    return card.cardType.slice(0, 4);
  }

  /**
   * Vraća CSS klasu za gradijent thumbnail-a kartice na osnovu brenda.
   * - Visa: plavo-ljubičasto
   * - Mastercard: narandžasto
   * - DinaCard: crveno
   * - American Express: indigo
   * - Ostalo: teal
   */
  public getCardGradient(card: Card): string {
    const num = card.cardNumber.replace(/\D/g, '');
    if (num.startsWith('4')) return 'thumb--blue';
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'thumb--orange';
    if (num.startsWith('9891')) return 'thumb--red';
    if (num.startsWith('34') || num.startsWith('37')) return 'thumb--indigo';
    return 'thumb--teal';
  }
}

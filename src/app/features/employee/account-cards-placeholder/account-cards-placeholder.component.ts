import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface AccountCardPlaceholder {
  cardNumber: string;
  ownerName: string;
  ownerEmail: string;
  status: 'Aktivna' | 'Blokirana' | 'Deaktivirana';
}

@Component({
  selector: 'app-account-cards-placeholder',
  templateUrl: './account-cards-placeholder.component.html',
  styleUrls: ['./account-cards-placeholder.component.scss']
})
export class AccountCardsPlaceholderComponent implements OnInit {
  accountNumber = '';
  ownerName = '';
  ownershipType = '';
  accountType = '';
  status = '';

  cards: AccountCardPlaceholder[] = [];

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.accountNumber = this.route.snapshot.queryParamMap.get('accountNumber') || '';
    this.ownerName = this.route.snapshot.queryParamMap.get('ownerName') || '';
    this.ownershipType = this.route.snapshot.queryParamMap.get('ownershipType') || '';
    this.accountType = this.route.snapshot.queryParamMap.get('accountType') || '';
    this.status = this.route.snapshot.queryParamMap.get('status') || '';

    this.cards = [
      {
        cardNumber: '4578 ******** 1123',
        ownerName: this.ownerName || 'Marko Markovic',
        ownerEmail: 'marko@example.com',
        status: 'Aktivna'
      },
      {
        cardNumber: '5210 ******** 8842',
        ownerName: this.ownerName || 'Marko Markovic',
        ownerEmail: 'marko@example.com',
        status: 'Blokirana'
      }
    ];
  }

  trackByCard(index: number, card: AccountCardPlaceholder): string {
    return card.cardNumber;
  }
}
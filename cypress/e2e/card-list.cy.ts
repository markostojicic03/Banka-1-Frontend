// cypress/e2e/card-list.cy.ts
// E2E testovi za Card List komponentu (F3)

export {};
const MOCK_ACCOUNTS = [
  {
    nazivRacuna: 'Moj tekući račun',
    brojRacuna: '265000000012345678',
    raspolozivoStanje: 81556.74,
    currency: 'RSD',
    accountCategory: 'CHECKING',
    accountType: 'PERSONAL',
    subtype: 'STANDARD'
  },
  {
    nazivRacuna: 'Poslovni račun',
    brojRacuna: '265000000087654321',
    raspolozivoStanje: 120000.00,
    currency: 'RSD',
    accountCategory: 'CHECKING',
    accountType: 'BUSINESS',
    subtype: 'DOO'
  }
];

const MOCK_ACCOUNT_DETAILS_1 = {
  nazivRacuna: 'Moj tekući račun',
  brojRacuna: '265000000012345678',
  cards: [
    {
      id: 1,
      cardNumber: '57989999999995571',
      cardType: 'DEBIT',
      status: 'ACTIVE',
      expiryDate: '08/27',
      accountNumber: '265000000012345678'
    },
    {
      id: 2,
      cardNumber: '43261111111112865',
      cardType: 'DEBIT',
      status: 'BLOCKED',
      expiryDate: '03/26',
      accountNumber: '265000000012345678'
    }
  ]
};

const MOCK_ACCOUNT_DETAILS_2 = {
  nazivRacuna: 'Poslovni račun',
  brojRacuna: '265000000087654321',
  cards: [
    {
      id: 3,
      cardNumber: '57994444444441443',
      cardType: 'CREDIT',
      status: 'EXPIRED',
      expiryDate: '01/24',
      accountNumber: '265000000087654321'
    },
    {
      id: 4,
      cardNumber: '43265555555552888',
      cardType: 'DEBIT',
      status: 'ACTIVE',
      expiryDate: '11/28',
      accountNumber: '265000000087654321'
    }
  ]
};

const setAuth = (): void => {
  cy.window().then(win => {
    win.localStorage.setItem('authToken', 'fake-jwt-token');
    win.localStorage.setItem('loggedUser', JSON.stringify({
      email: 'klijent@test.com',
      role: 'CLIENT_BASIC',
      permissions: ['BANKING_BASIC']
    }));
  });
};

const clearAuth = (): void => {
  cy.window().then(win => {
    win.localStorage.removeItem('authToken');
    win.localStorage.removeItem('loggedUser');
  });
};

describe('Card List Component (F3)', () => {

  beforeEach(() => {
    // Interceptujemo GET /client/accounts — lista računa
    cy.intercept('GET', '**/client/accounts*', {
      statusCode: 200,
      body: {
        content: MOCK_ACCOUNTS,
        totalElements: 2,
        totalPages: 1,
        number: 0
      }
    }).as('getAccounts');

    // Interceptujemo GET /client/api/accounts/{brojRacuna} — detalji sa karticama
    cy.intercept('GET', `**/client/api/accounts/${MOCK_ACCOUNTS[0].brojRacuna}`, {
      statusCode: 200,
      body: MOCK_ACCOUNT_DETAILS_1
    }).as('getAccountDetails1');

    cy.intercept('GET', `**/client/api/accounts/${MOCK_ACCOUNTS[1].brojRacuna}`, {
      statusCode: 200,
      body: MOCK_ACCOUNT_DETAILS_2
    }).as('getAccountDetails2');

    setAuth();
    cy.visit('/home/cards');
    cy.wait('@getAccounts');
    cy.wait('@getAccountDetails1');
    cy.wait('@getAccountDetails2');
  });

  // ===========================================================
  // Prikaz stranice
  // ===========================================================

  it('treba da prikaže naslov stranice', () => {
    cy.get('h1').should('contain', 'Kartice');
  });

  it('treba da prikaže podnaslov stranice', () => {
    cy.contains('Pregled svih vaših platnih kartica').should('exist');
  });

  // ===========================================================
  // Grupisanje po računu
  // ===========================================================

  it('treba da prikaže kartice grupisane po računu', () => {
    cy.contains('Moj tekući račun').should('exist');
    cy.contains('Poslovni račun').should('exist');
  });

  it('treba da prikaže broj računa ispod naziva grupe', () => {
    cy.contains('265000000012345678').should('exist');
    cy.contains('265000000087654321').should('exist');
  });

  it('treba da prikaže tačan broj kartica — 4 ukupno', () => {
    cy.get('.flex.items-center.gap-4.p-4.rounded-xl').should('have.length', 4);
  });

  // ===========================================================
  // Prikaz kartice — naziv i vrsta
  // ===========================================================

  it('treba da prikaže naziv vrste kartice', () => {
    cy.contains('DEBIT').should('exist');
    cy.contains('CREDIT').should('exist');
  });

  it('treba da prikaže human-readable vrstu kartice', () => {
    cy.contains('Debitna').should('exist');
    cy.contains('Kreditna').should('exist');
  });

  // ===========================================================
  // Maskiranje broja kartice
  // ===========================================================

  it('treba da prikaže broj kartice u formatu: XXXX **** **** XXXX', () => {
    cy.get('.font-mono.font-semibold').each(($el: JQuery<HTMLElement>) => {
      const text = $el.text().trim();
      expect(text).to.match(/^\d{4} \*{4} \*{4} \d{4}$/);
    });
  });

  it('treba da prikaže tačno maskiran broj prve kartice: 5798 **** **** 5571', () => {
    cy.contains('5798 **** **** 5571').should('exist');
  });

  it('treba da prikaže tačno maskiran broj druge kartice: 4326 **** **** 2865', () => {
    cy.contains('4326 **** **** 2865').should('exist');
  });

  // ===========================================================
  // Status badge
  // ===========================================================

  it('treba da prikaže zeleni badge za aktivnu karticu', () => {
    cy.get('.z-badge-green').first().should('contain', 'Aktivna');
  });

  it('treba da prikaže crveni badge za blokiranu karticu', () => {
    cy.get('.z-badge-red').first().should('contain', 'Blokirana');
  });

  it('treba da prikaže sivi badge za deaktivirana karticu', () => {
    cy.get('.z-badge-gray').first().should('contain', 'Deaktivirana');
  });

  // ===========================================================
  // Dugme "Blokiraj" — samo za ACTIVE
  // ===========================================================

  it('treba da prikaže dugme "Blokiraj" za aktivne kartice', () => {
    cy.contains('Blokiraj').should('exist');
  });

  it('treba da NE prikaže dugme "Blokiraj" za blokiranu karticu', () => {
    // Blokirana kartica (id=2) treba da ima "Deblokiraj" a ne "Blokiraj"
    cy.get('.z-badge-red').first().parents('.flex.items-center.gap-4')
      .find('button').should('not.contain', 'Blokiraj');
  });

  it('treba da NE prikaže nijedno dugme za deaktiviranu karticu', () => {
    cy.get('.z-badge-gray').first().parents('.flex.items-center.gap-4')
      .find('button').should('not.exist');
  });

  // ===========================================================
  // Dugme "Deaktiviraj"
  // ===========================================================

  it('treba da prikaže dugme "Deaktiviraj" za aktivne kartice', () => {
    cy.get('.z-badge-green').first().parents('.flex.items-center.gap-4')
      .contains('Deaktiviraj').should('exist');
  });

  it('treba da prikaže dugme "Deaktiviraj" za blokirane kartice', () => {
    cy.get('.z-badge-red').first().parents('.flex.items-center.gap-4')
      .contains('Deaktiviraj').should('exist');
  });

  // ===========================================================
  // Dugme "Deblokiraj" — samo za BLOCKED
  // ===========================================================

  it('treba da prikaže dugme "Deblokiraj" za blokiranu karticu', () => {
    cy.get('.z-badge-red').first().parents('.flex.items-center.gap-4')
      .contains('Deblokiraj').should('exist');
  });

  // ===========================================================
  // Confirmation dialog — Blokiranje
  // ===========================================================

  it('treba da otvori confirmation dialog klikom na "Blokiraj"', () => {
    cy.get('.z-badge-green').first().parents('.flex.items-center.gap-4')
      .contains('Blokiraj').click();
    cy.get('.z-overlay').should('be.visible');
    cy.get('.z-modal').should('be.visible');
  });

  it('treba da prikaže naslov "Blokiranje kartice" u dialogu', () => {
    cy.get('.z-badge-green').first().parents('.flex.items-center.gap-4')
      .contains('Blokiraj').click();
    cy.get('.z-modal').contains('Blokiranje kartice').should('be.visible');
  });

  it('treba da prikaže maskirani broj kartice u dialogu', () => {
    cy.get('.z-badge-green').first().parents('.flex.items-center.gap-4')
      .contains('Blokiraj').click();
    cy.get('.z-modal').invoke('text').then((text: string) => {
      expect(text).to.match(/\d{4} \*{4} \*{4} \d{4}/);
    });
  });

  it('treba da zatvori dialog klikom na "Otkaži"', () => {
    cy.get('.z-badge-green').first().parents('.flex.items-center.gap-4')
      .contains('Blokiraj').click();
    cy.get('.z-modal').contains('Otkaži').click();
    cy.get('.z-overlay').should('not.exist');
  });

  it('treba da zatvori dialog klikom van modala', () => {
    cy.get('.z-badge-green').first().parents('.flex.items-center.gap-4')
      .contains('Blokiraj').click();
    cy.get('.z-overlay').click({ force: true });
    cy.get('.z-overlay').should('not.exist');
  });

  it('treba da pozove API za blokiranje i osvezi listu nakon potvrde', () => {
    cy.intercept('PATCH', '**/cards/1/block', { statusCode: 200 }).as('blockCard');

    cy.get('.z-badge-green').first().parents('.flex.items-center.gap-4')
      .contains('Blokiraj').click();
    cy.get('.z-modal').contains('Potvrdi blokiranje').click();

    cy.wait('@blockCard');
    cy.get('.z-overlay').should('not.exist');
  });

  // ===========================================================
  // Confirmation dialog — Deblokiranje
  // ===========================================================

  it('treba da otvori dialog za deblokiranje klikom na "Deblokiraj"', () => {
    cy.get('.z-badge-red').first().parents('.flex.items-center.gap-4')
      .contains('Deblokiraj').click();
    cy.get('.z-modal').contains('Deblokiranje kartice').should('be.visible');
  });

  it('treba da pozove API za deblokiranje nakon potvrde', () => {
    cy.intercept('PATCH', '**/cards/2/unblock', { statusCode: 200 }).as('unblockCard');

    cy.get('.z-badge-red').first().parents('.flex.items-center.gap-4')
      .contains('Deblokiraj').click();
    cy.get('.z-modal').contains('Potvrdi deblokiranje').click();

    cy.wait('@unblockCard');
    cy.get('.z-overlay').should('not.exist');
  });

  // ===========================================================
  // Confirmation dialog — Deaktiviranje
  // ===========================================================

  it('treba da otvori dialog za deaktiviranje klikom na "Deaktiviraj"', () => {
    cy.get('.z-badge-green').first().parents('.flex.items-center.gap-4')
      .contains('Deaktiviraj').click();
    cy.get('.z-modal').contains('Deaktiviranje kartice').should('be.visible');
  });

  it('treba da prikaže upozorenje da se kartica ne može reaktivirati', () => {
    cy.get('.z-badge-green').first().parents('.flex.items-center.gap-4')
      .contains('Deaktiviraj').click();
    cy.get('.z-modal').contains('ne može biti ponovo aktivirana').should('exist');
  });

  it('treba da pozove API za deaktiviranje nakon potvrde', () => {
    cy.intercept('PATCH', '**/cards/1/deactivate', { statusCode: 200 }).as('deactivateCard');

    cy.get('.z-badge-green').first().parents('.flex.items-center.gap-4')
      .contains('Deaktiviraj').click();
    cy.get('.z-modal').contains('Potvrdi deaktiviranje').click();

    cy.wait('@deactivateCard');
    cy.get('.z-overlay').should('not.exist');
  });


  // ===========================================================
  // Auth guard
  // ===========================================================

  it('treba da preusmeri na login ako korisnik nije ulogovan', () => {
    clearAuth();
    cy.visit('/home/cards');
    cy.url().should('include', '/login');
  });

});

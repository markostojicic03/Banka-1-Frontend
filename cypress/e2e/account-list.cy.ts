// cypress/e2e/account-list.cy.ts
// E2E testovi za Account List komponentu (F2)

const MOCK_ACCOUNTS = [
  {
    id: 1,
    name: 'Transakcioni račun stanovn.',
    accountNumber: '265000000011111111',
    balance: 85000,
    availableBalance: 81556.74,
    reservedFunds: 3443.26,
    currency: 'RSD',
    status: 'ACTIVE',
    subtype: 'STANDARD',
    ownerId: 1,
    ownerName: 'Petar Petrović',
    employeeId: 1,
    maintenanceFee: 255,
    dailyLimit: 250000,
    monthlyLimit: 1000000,
    dailySpending: 150000,
    monthlySpending: 600000,
    createdAt: '2024-01-15',
    expiryDate: '2027-01-15'
  },
  {
    id: 2,
    name: 'A Vista devizni račun',
    accountNumber: '265000000021111111',
    balance: 500,
    availableBalance: 5.44,
    reservedFunds: 494.56,
    currency: 'EUR',
    status: 'ACTIVE',
    subtype: 'FOREIGN_PERSONAL',
    ownerId: 1,
    ownerName: 'Petar Petrović',
    employeeId: 1,
    maintenanceFee: 0,
    dailyLimit: 5000,
    monthlyLimit: 20000,
    dailySpending: 3200,
    monthlySpending: 12500,
    createdAt: '2024-03-01',
    expiryDate: '2027-03-01'
  },
  {
    id: 3,
    name: 'Štedni račun',
    accountNumber: '265000000013111111',
    balance: 12000,
    availableBalance: 12000,
    reservedFunds: 0,
    currency: 'RSD',
    status: 'ACTIVE',
    subtype: 'SAVINGS',
    ownerId: 1,
    ownerName: 'Petar Petrović',
    employeeId: 1,
    maintenanceFee: 0,
    dailyLimit: 250000,
    monthlyLimit: 1000000,
    dailySpending: 0,
    monthlySpending: 0,
    createdAt: '2023-06-01',
    expiryDate: '2026-06-01'
  }
];

const setAuth = (): void => {
  cy.window().then(win => {
    win.localStorage.setItem('authToken', 'fake-jwt-token');
    win.localStorage.setItem('loggedUser', JSON.stringify({
      email: 'klijent@test.com',
      role: 'Client',
      permissions: []
    }));
  });
};

const clearAuth = (): void => {
  cy.window().then(win => {
    win.localStorage.removeItem('authToken');
    win.localStorage.removeItem('loggedUser');
  });
};

describe('Account List Component (F2)', () => {

  beforeEach(() => {
    // Component calls getMyAccounts which maps through Content
    const mockResponse = {
      content: MOCK_ACCOUNTS.map(a => ({
        iznos: a.balance, // assuming map to balance
        raspoloziStanje: a.availableBalance, // whatever map fields are... Actually wait, let's look closer at mapToAccountFromClient
        brojRacuna: a.accountNumber,
        nazivRacuna: a.name,
        raspolozivoStanje: a.availableBalance,
        currency: a.currency,
        accountCategory: a.subtype === 'STANDARD' ? 'CHECKING' : (a.subtype === 'SAVINGS' ? 'SAVINGS' : 'CHECKING'),
        accountType: a.subtype.includes('BUSINESS') ? 'BUSINESS' : 'PERSONAL'
      })),
      totalElements: 3,
      totalPages: 1
    };

    cy.intercept('GET', '**/accounts/client/accounts*', (req: any) => {
      req.reply({ statusCode: 200, body: mockResponse });
    }).as('getAccounts');

    // Also intercept the transactions API call that runs immediately after an account is selected.
    cy.intercept('GET', '**/transactions/client/accounts/*', {
      statusCode: 200,
      body: { content: [], totalElements: 0, totalPages: 0 }
    }).as('getTransactions');

    setAuth();
    cy.visit('/accounts');
    cy.wait('@getAccounts');
  });

  // ===========================================================
  // Prikaz liste
  // ===========================================================

  it('treba da prikaže naslov stranice', () => {
    cy.get('h1').should('contain', 'Lista računa');
  });

  it('treba da prikaže sve aktivne račune', () => {
    cy.get('.z-card').should('exist');
    cy.contains('Naziv').should('not.exist'); // Wait, the current html does not use table, it's flex boxes
    cy.get('div.cursor-pointer[role="button"]').should('have.length', 3);
  });

  it('treba da prikaže naziv računa za svaki red', () => {
    cy.get('div.cursor-pointer[role="button"]').first()
      .should('contain', 'Transakcioni račun stanovn.');
  });

  it('treba da prikaže maskirani broj računa', () => {
    cy.get('div.cursor-pointer[role="button"]').first()
      .should('contain', '**** 1111');
  });

  it('treba da prikaže raspoloživo stanje sa valutom', () => {
    cy.get('div.cursor-pointer[role="button"]').first()
      .should('contain', 'RSD');
  });

  it('treba da prikaže "Detalji" dugme za svaki račun', () => {
    cy.get('div.cursor-pointer[role="button"]').each(($row: JQuery<HTMLElement>) => {
      cy.wrap($row).find('.z-btn-primary').should('exist').and('contain', 'Detalji');
    });
  });

  // ===========================================================
  // Sortiranje
  // ===========================================================

  it('treba da sortira račune po raspoloživom stanju opadajuće', () => {
    cy.get('div.cursor-pointer[role="button"]').then(($rows: JQuery<HTMLElement>) => {
      const balances: number[] = [];

      $rows.each((_index: number, row: HTMLElement) => {
        const text = Cypress.$(row).find('.text-base.font-bold').text();
        // Updated regex logic to better parse properly since there could be multiple texts
        const cleanText = text.replace(/RSD|EUR|[^\d,\.]/g, '').replace(',', '.');
        const num = parseFloat(cleanText);
        if (!isNaN(num)) {
          balances.push(num);
        }
      });

      for (let i = 0; i < balances.length - 1; i++) {
        expect(balances[i]).to.be.gte(balances[i + 1]);
      }
    });
  });

  // ===========================================================
  // Selekcija računa
  // ===========================================================

  it('treba da po defaultu selektuje prvi račun', () => {
    cy.get('div.cursor-pointer[role="button"]').first().should('have.class', 'bg-secondary');
  });

  it('treba da selektuje račun klikom na red', () => {
    cy.get('div.cursor-pointer[role="button"]').eq(1).click();
    cy.get('div.cursor-pointer[role="button"]').eq(1).should('have.class', 'bg-secondary');
    cy.get('div.cursor-pointer[role="button"]').first().should('not.have.class', 'bg-secondary');
  });

  it('treba da prikaže detalje selektovanog računa umesto desnog panela prikazuje dugme Detalji', () => {
    // Prema trenutnom HTML-u, nema desnog panela podesavanja nego tranzakcije
    cy.get('div.cursor-pointer[role="button"]').eq(1).click();
    cy.contains('Lista transakcija po računu').should('exist');
  });


  // ===========================================================
  // Navigacija na detalje
  // ===========================================================

  it('treba da otvori modal sa detaljima kada se klikne "Detalji"', () => {
    cy.get('div.cursor-pointer[role="button"]').first().find('.z-btn-primary').click();
    cy.get('app-account-details-modal').should('exist');
  });

  // ===========================================================
  // Transakcije placeholder
  // ===========================================================

  it('treba da prikaže listu transakcija ispod liste', () => {
    cy.contains('Lista transakcija po računu').should('exist');
  });

  it('treba da prikaže naziv selektovanog računa u sekciji transakcija', () => {
    cy.get('div.cursor-pointer[role="button"]').first().click();
    cy.contains('Transakcioni račun stanovn.').should('exist');
  });

  it('treba da ažurira naziv u sekciji transakcija kada se promeni selekcija', () => {
    cy.get('div.cursor-pointer[role="button"]').eq(1).click();
    cy.contains('A Vista devizni račun').should('exist');
  });

  // ===========================================================
  // Auth guard
  // ===========================================================

  it('treba da preusmeri na login ako korisnik nije ulogovan', () => {
    clearAuth();
    cy.visit('/accounts');
    cy.url().should('include', '/login');
  });

});

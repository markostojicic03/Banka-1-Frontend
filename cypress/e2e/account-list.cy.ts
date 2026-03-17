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
  localStorage.setItem('authToken', 'fake-jwt-token');
  localStorage.setItem('loggedUser', JSON.stringify({
    email: 'klijent@test.com',
    role: 'Client',
    permissions: []
  }));
};

const clearAuth = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('loggedUser');
};

describe('Account List Component (F2)', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/accounts/my', (req: any) => {
      if (req.headers['accept']?.includes('text/html')) {
        return req.continue();
      }
      req.reply({ statusCode: 200, body: MOCK_ACCOUNTS });
    }).as('getAccounts');

    setAuth();
    cy.visit('/accounts');
    cy.wait('@getAccounts');
  });

  // ===========================================================
  // Prikaz liste
  // ===========================================================

  it('treba da prikaže naslov stranice', () => {
    cy.get('.page-title').should('contain', 'LISTA RAČUNA');
  });

  it('treba da prikaže sve aktivne račune', () => {
    cy.get('.account-row').should('have.length', 3);
  });

  it('treba da prikaže naziv računa za svaki red', () => {
    cy.get('.account-row').first().find('.account-info__name')
      .should('contain', 'Transakcioni račun stanovn.');
  });

  it('treba da prikaže maskirani broj računa', () => {
    cy.get('.account-row').first().find('.account-info__number')
      .should('contain', '**** 1111');
  });

  it('treba da prikaže raspoloživo stanje sa valutom', () => {
    cy.get('.account-row').first().find('.account-balance__amount')
      .should('contain', 'RSD');
  });

  it('treba da prikaže "DETALJI" dugme za svaki račun', () => {
    cy.get('.account-row').each(($row: JQuery<HTMLElement>) => {
      cy.wrap($row).find('.btn-details').should('exist').and('contain', 'DETALJI');
    });
  });

  // ===========================================================
  // Sortiranje
  // ===========================================================

  it('treba da sortira račune po raspoloživom stanju opadajuće', () => {
    cy.get('.account-row').then(($rows: JQuery<HTMLElement>) => {
      const balances: number[] = [];

      $rows.each((_index: number, row: HTMLElement) => {
        const text = Cypress.$(row).find('.account-balance__amount').text();
        const num = parseFloat(
          text.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')
        );
        balances.push(num);
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
    cy.get('.account-row').first().should('have.class', 'account-row--active');
  });

  it('treba da selektuje račun klikom na red', () => {
    cy.get('.account-row').eq(1).click();
    cy.get('.account-row').eq(1).should('have.class', 'account-row--active');
    cy.get('.account-row').first().should('not.have.class', 'account-row--active');
  });

  it('treba da prikaže detalje selektovanog računa u desnom panelu', () => {
    cy.get('.account-row').eq(1).click();
    cy.get('.detail-row').should('exist');
    cy.get('.panel-label').should('contain', 'PODEŠAVANJA');
  });


  // ===========================================================
  // Navigacija na detalje
  // ===========================================================

  it('treba da naviguje na /accounts/:id kada se klikne "DETALJI"', () => {
    cy.get('.account-row').first().find('.btn-details').click();
    cy.url().should('match', /\/accounts\/\d+/);
  });

  // ===========================================================
  // Transakcije placeholder
  // ===========================================================

  it('treba da prikaže placeholder za transakcije ispod liste', () => {
    cy.get('.transactions-section').should('exist');
    cy.get('.transactions-placeholder').should('be.visible');
  });

  it('treba da prikaže naziv selektovanog računa u sekciji transakcija', () => {
    cy.get('.transactions-account-name').should('not.be.empty');
  });

  it('treba da ažurira naziv u sekciji transakcija kada se promeni selekcija', () => {
    cy.get('.account-row').eq(1).click();
    cy.get('.account-row').eq(1).find('.account-info__name').invoke('text').then((name: string) => {
      cy.get('.transactions-account-name').should('contain', name.trim());
    });
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

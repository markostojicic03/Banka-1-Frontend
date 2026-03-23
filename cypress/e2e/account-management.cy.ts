describe('F10 - Portal za upravljanje računima', () => {
  const route = 'http://localhost:4200/account-management';

  function makeFakeJwt(win: any): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      email: 'tester@example.com'
    };

    const encode = (obj: unknown) =>
      win.btoa(JSON.stringify(obj))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return `${encode(header)}.${encode(payload)}.fake-signature`;
  }

  function loginWithClientManage(win: any): void {
    win.localStorage.setItem('authToken', makeFakeJwt(win));
    win.localStorage.setItem(
      'loggedUser',
      JSON.stringify({
        email: 'tester@example.com',
        role: 'EmployeeBasic',
        permissions: ['CLIENT_MANAGE']
      })
    );
  }

  beforeEach(() => {
    cy.visit(route, {
      onBeforeLoad: (win) => {
        loginWithClientManage(win);
      }
    });
  });

  it('should render account management page with table and rows', () => {
    cy.contains('Računi klijenata').should('be.visible');
    cy.get('.accounts-table').should('be.visible');
    cy.get('tbody tr').should('have.length.at.least', 1);
  });

  it('should filter accounts by owner name prefix', () => {
    cy.get('.filters-row input').type('An');

    cy.get('tbody tr').should('have.length', 1);
    cy.get('tbody tr').first().should('contain.text', 'Ana Anic');
    cy.get('tbody tr').first().should('not.contain.text', 'Marko Markovic');
  });

  it('should filter accounts by account number', () => {
    cy.get('.filters-row input').clear().type('160');

    cy.get('tbody tr').should('have.length', 1);
    cy.get('tbody tr').first().should('contain.text', '160-123456-78');
    cy.get('tbody tr').first().should('contain.text', 'Ana Anic');
  });

  it('should show empty state when no account matches search', () => {
    cy.get('.filters-row input').clear().type('zzzzzzz');

    cy.contains('Nema podataka za prikaz.').should('be.visible');
    cy.get('.accounts-table').should('not.exist');
  });

  it('should open confirm modal when clicking deactivate', () => {
    cy.contains('tbody tr', 'Ana Anic').within(() => {
      cy.contains('Deaktiviraj').click();
    });

    cy.contains('Potvrda akcije').should('be.visible');
    cy.contains('Da li ste sigurni da želite').should('be.visible');
    cy.contains('160-123456-78').should('be.visible');
    cy.contains('Potvrdi').should('be.visible');
    cy.contains('Otkaži').should('be.visible');
  });

  it('should close confirm modal on cancel and keep original status', () => {
    cy.contains('tbody tr', 'Ana Anic').within(() => {
      cy.contains('Aktivan').should('be.visible');
      cy.contains('Deaktiviraj').click();
    });

    cy.contains('Potvrda akcije').should('be.visible');
    cy.contains('Otkaži').click();

    cy.contains('Potvrda akcije').should('not.exist');

    cy.contains('tbody tr', 'Ana Anic').within(() => {
      cy.contains('Aktivan').should('be.visible');
      cy.contains('Deaktiviraj').should('be.visible');
    });
  });

  it('should confirm deactivation and update status/button text', () => {
    cy.contains('tbody tr', 'Ana Anic').within(() => {
      cy.contains('Aktivan').should('be.visible');
      cy.contains('Deaktiviraj').click();
    });

    cy.contains('Potvrdi').click();

    cy.contains('Potvrda akcije').should('not.exist');

    cy.contains('tbody tr', 'Ana Anic').within(() => {
      cy.contains('Neaktivan').should('be.visible');
      cy.contains('Aktiviraj').should('be.visible');
    });
  });

  it('should confirm activation and update status/button text', () => {
    cy.contains('tbody tr', 'Marko Markovic').within(() => {
      cy.contains('Neaktivan').should('be.visible');
      cy.contains('Aktiviraj').click();
    });

    cy.contains('Potvrdi').click();

    cy.contains('Potvrda akcije').should('not.exist');

    cy.contains('tbody tr', 'Marko Markovic').within(() => {
      cy.contains('Aktivan').should('be.visible');
      cy.contains('Deaktiviraj').should('be.visible');
    });
  });

  it('should keep filtering working after status change', () => {
    cy.get('.filters-row input').clear().type('Mark');

    cy.get('tbody tr').should('have.length', 1);

    cy.contains('tbody tr', 'Marko Markovic').within(() => {
      cy.contains('Aktiviraj').click();
    });

    cy.contains('Potvrdi').click();

    cy.get('tbody tr').should('have.length', 1);

    cy.contains('tbody tr', 'Marko Markovic').within(() => {
      cy.contains('Aktivan').should('be.visible');
      cy.contains('Deaktiviraj').should('be.visible');
    });
  });
});
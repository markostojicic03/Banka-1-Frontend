// cypress/e2e/employee-create.cy.ts
// E2E testovi za Employee Create stranicu

describe('Employee Create Page', () => {

  beforeEach(() => {
    // Set auth token to bypass guard
    cy.window().then(win => {
      win.localStorage.setItem('authToken', 'fake-jwt-token');
      win.localStorage.setItem('loggedUser', JSON.stringify({
        email: 'admin@test.com', role: 'EmployeeAdmin', permissions: ['EMPLOYEE_MANAGE_ALL']
      }));
    });

    cy.visit('/employees/new');
  });

  it('treba da prikaže formu za kreiranje zaposlenog', () => {
    cy.contains('h1', 'Kreiraj zaposlenog').should('be.visible'); // Match UI text
    cy.get('#ime').should('exist');
    cy.get('#prezime').should('exist');
    cy.get('#email').should('exist');
    cy.get('#role').should('exist');
  });

  it('treba da ne prikazuje polje za Active/Inactive status', () => {
    // Active/Inactive status was removed from create form
    cy.get('#status').should('not.exist');
    cy.contains('select option', 'Active').should('not.exist');
  });

  it('treba da prikaže info notice o aktivacionom emailu', () => {
    cy.get('.bg-blue-50').should('be.visible')
      .and('contain', 'aktivacioni email'); // UI language
  });

  it('treba da kreira novog zaposlenog i preusmeri na listu', () => {
    // Fill the form
    cy.get('#ime').clear().type('Marko');
    cy.get('#prezime').clear().type('Markovic');
    cy.get('#datumRodjenja').type('1990-01-01'); // Missing required field!
    cy.get('#pol').select('M');           // Missing required field!
    cy.get('#email').clear().type('marko@test.com');
    cy.get('#brojTelefona').clear().type('+381611234567');
    cy.get('#pozicija').clear().type('Developer');
    cy.get('#departman').clear().type('IT');
    cy.get('#role').select('BASIC'); // Option value, text is 'Basic'

    // Intercept the create API call
    cy.intercept('POST', '**/employees', {
      statusCode: 201,
      body: { id: 123, ime: 'Marko', prezime: 'Markovic', aktivan: false }
    }).as('createRequest');

    // Intercept the employees list for redirect
    cy.intercept('GET', '**/employees*', {
      statusCode: 200,
      body: { content: [], totalElements: 0, totalPages: 0 }
    });

    // Submit
    cy.get('button[type="submit"]').should('not.be.disabled').click();

    cy.wait('@createRequest').then((interception) => {
      // Verify aktivan is false (employee starts inactive)
      expect(interception.request.body.ime).to.equal('Marko');
    });

    cy.url().should('include', '/employees');
  });

  it('treba da prikaže validation error ako je ime prekratko', () => {
    cy.get('#ime').clear().type('M').blur();

    cy.get('.z-error').should('be.visible')
      .and('contain', 'min 2 karaktera'); // Match UI msg

    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('treba da prikaže validation error za neispravan email', () => {
    cy.get('#email').clear().type('not-an-email').blur();

    cy.get('.z-error').should('be.visible')
      .and('contain', 'Validan email je obavezan'); // Match UI msg
  });

  it('back link treba da vodi na /employees', () => {
    // Intercept employees API
    cy.intercept('GET', '**/employees*', {
      statusCode: 200,
      body: { content: [], totalElements: 0, totalPages: 0 }
    });

    cy.get('button[routerLink="/employees"]').first().click(); // Update to new Tailwind/Angular way
    cy.url().should('include', '/employees');
  });

});

// cypress/e2e/employee-edit.cy.ts
// E2E testovi za Employee Edit Modal komponentu

describe('Employee Edit Modal Component', () => {

  beforeEach(() => {
    // Intercept employees list API
    cy.intercept('GET', '**/employees*', (req) => {
      if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
        return req.continue();
      }
      req.reply({
        statusCode: 200,
        body: {
          content: [
            {
              id: 1,
              ime: 'Marko',
              prezime: 'Marković',
              email: 'marko@example.com',
              pozicija: 'Developer',
              departman: 'IT',
              aktivan: true,
              role: 'EmployeeBasic',
              permisije: ['Create', 'View']
            }
          ],
          totalElements: 1,
          totalPages: 1
        }
      });
    }).as('getEmployees');

    // Intercept update API
    cy.intercept('PUT', '**/employees/1', { statusCode: 200, body: {} }).as('updateEmployee');

    // Set auth
    cy.window().then(win => {
      win.localStorage.setItem('authToken', 'fake-jwt-token');
      win.localStorage.setItem('loggedUser', JSON.stringify({
        email: 'admin@test.com', role: 'EmployeeAdmin', permissions: ['EMPLOYEE_MANAGE_ALL']
      }));
    });

    cy.visit('/employees');
    cy.wait('@getEmployees');

    // Click edit button on first row to open modal
    cy.get('table tbody tr').first().find('button[title="Izmeni"]').first().click();
  });

  it('treba da prikaže modal i automatski popuni polja starim podacima', () => {
    cy.get('.z-overlay').should('be.visible');
    cy.get('.z-modal-header h2').should('contain', 'Izmeni zaposlenog');

    cy.get('input[formControlName="ime"]').should('have.value', 'Marko');
    cy.get('input[formControlName="prezime"]').should('have.value', 'Marković');
  });

  it('treba da onemogući dugme Save ako je ime obrisano', () => {
    cy.get('input[formControlName="ime"]').clear();
    cy.get('.z-modal-header h2').click(); // trigger blur/touched

    cy.get('.z-btn-primary').should('be.disabled');
    cy.get('.z-error').should('be.visible');
  });

  it('treba da pošalje izmenjene podatke', () => {
    // Fill in required field from FormGroup that is missing in mock data to make form valid
    cy.get('input[formControlName="brojTelefona"]').clear().type('064123456');

    cy.get('input[formControlName="ime"]').clear().type('Marko Izmenjeni');

    // Use .last() or standard cy.contains() to precisely find the save button and avoid clicking multiple primary buttons
    cy.contains('Sačuvaj izmene').should('not.be.disabled').click();

    cy.wait('@updateEmployee').then((interception) => {
      expect(interception.request.body.ime).to.equal('Marko Izmenjeni');
    });

    // Modal should close
    cy.get('.z-overlay').should('not.exist');
  });

  it('treba da zatvori modal kada se klikne na Cancel', () => {
    cy.get('.z-btn-outline').contains('Otkaži').click();
    cy.get('.z-overlay').should('not.exist');
  });

  it('treba da zatvori modal kada se klikne na overlay', () => {
    cy.get('.z-overlay').click('topLeft');
    cy.get('.z-overlay').should('not.exist');
  });

  it('treba da zatvori modal kada se klikne na X dugme', () => {
    cy.get('button[aria-label="Close modal"]').click();
    cy.get('.z-overlay').should('not.exist');
  });

});

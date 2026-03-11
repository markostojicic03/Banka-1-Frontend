describe('Employee Create Page', () => {
  beforeEach(() => {
    // 1. Postavljamo lažni token da nas Guard ne bi izbacio na login
    localStorage.setItem('authToken', 'moj-lazni-token');
    
    // 2. Odlazimo na stranicu za kreiranje
    cy.visit('/employees/new');
  });

  it('should create a new employee and redirect to list', () => {
    // Provera da li smo na pravoj stranici
    cy.contains('h2', 'Create employee').should('be.visible');

    // Popunjavanje forme
    // Koristimo 'id' ili 'formControlName' za pronalaženje elemenata
    cy.get('#fullName').type('Marko Markovic');
    cy.get('#email').type('marko@test.com');
    
    cy.get('#role').select('Admin');
    cy.get('#status').select('Active');

    // Klik na checkbox-ove za permisije
    cy.contains('Create').click();
    cy.contains('View').click();

    // Dugme bi sada trebalo da bude omogućeno
    cy.get('button[type="submit"]').should('not.be.disabled');

    // Presretanje (Intercept) mrežnog poziva da ne bismo stvarno gađali backend
    cy.intercept('POST', '**/api/employees', {
      statusCode: 201,
      body: { id: 123, ime: 'Marko', prezime: 'Markovic' }
    }).as('createRequest');

    // Klik na dugme za kreiranje
    cy.get('button[type="submit"]').click();

    // Provera da li je poslat ispravan zahtev
    cy.wait('@createRequest');

    // Provera da li nas je vratilo na tabelu
    cy.url().should('include', '/employees');
    cy.contains('Marko Markovic').should('exist');
  });

  it('should show validation error if name is too short', () => {
    // Kucamo samo 2 slova (minimum je 3)
    cy.get('#fullName').type('Ma').blur(); // blur() simulira izlazak iz polja (touched)
    
    // Provera da li se pojavila poruka o grešci
    cy.get('.error-msg').should('be.visible')
      .and('contain', 'Full name is required (min 3 chars).');

    // Provera da li je dugme i dalje onemogućeno
    cy.get('button[type="submit"]').should('be.disabled');
  });
});
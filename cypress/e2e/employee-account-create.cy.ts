describe('AccountCreate', () => {
  const route = 'http://localhost:4200/accounts/new';

  function makeFakeJwt(win: Window): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      email: 'tester@example.com',
    };

    const encode = (obj: unknown) =>
      win.btoa(JSON.stringify(obj))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return `${encode(header)}.${encode(payload)}.fake-signature`;
  }

  function loginWithClientManage(win: Window): void {
    win.localStorage.setItem('authToken', makeFakeJwt(win));
    win.localStorage.setItem(
      'loggedUser',
      JSON.stringify({
        email: 'tester@example.com',
        role: 'EmployeeBasic',
        permissions: ['CLIENT_MANAGE'],
      })
    );
  }

  beforeEach(() => {
    // Intercept client loading so the HTTP request completes and doesn't leave the UI spinning or uninitialized causing disabled fields
    cy.intercept('GET', '**/clients*', {
      statusCode: 200,
      body: {
        content: [
          { id: 1, ime: 'Petar', prezime: 'Petrović' },
          { id: 2, ime: 'Marko', prezime: 'Marković' }
        ],
        totalElements: 2,
        totalPages: 1,
        number: 0,
        size: 100
      }
    }).as('getClients');

    cy.visit(route, {
      onBeforeLoad(win) {
        loginWithClientManage(win);
      },
    });

    cy.wait('@getClients');
    cy.contains('Korak 1 - Tip računa', { timeout: 10000 }).should('be.visible');
  });

  it('DEVIZNI flow sa EUR i poslovnim vlasnikom uspešno šalje formu', () => {
    cy.intercept('POST', '**/employee/accounts/fx*', (req) => {
      req.reply({
        statusCode: 201,
        body: {
          id: 'acc-devizni',
          ...req.body,
        },
      });
    }).as('createAccount');

    // Korak 1
    cy.get('select[formControlName="kind"]').should('be.visible').select('Devizni');

    cy.get('select[formControlName="currency"]')
      .should('be.visible')
      .select('EUR');

    // Na slici se vidi drugi "Tip računa" sa Lični / Poslovni
    // zato uzimamo poslednji select za owner type
    cy.get('select[formControlName="ownerType"], select[formControlName="accountOwnerType"], select')
      .filter(':visible')
      .last()
      .select('Poslovni');

    cy.contains('button', 'Dalje').should('be.enabled').click();

    // Korak 2
    cy.contains('Korak 2 - Vlasnik', { timeout: 10000 }).should('be.visible');

    cy.get('select[formControlName="ownerId"]', { timeout: 10000 })
      .should('be.visible')
      .find('option')
      .then(($options) => {
        expect($options.length).to.be.greaterThan(1);
      });

    cy.get('select[formControlName="ownerId"]').select(1);

    cy.get('input[formControlName="initialBalance"]')
      .should('be.visible')
      .clear()
      .type('2500');

    cy.contains('Podaci o firmi').should('be.visible');

    cy.get('input[formControlName="companyName"]').type('Devizna Firma');
    // exact digits validation: 8 digits for matični broj, 9 digits for poreski
    cy.get('input[formControlName="companyNumber"]').type('12345678');
    cy.get('input[formControlName="companyTaxId"]').type('123456789');
    cy.get('input[formControlName="companyActivityCode"]').type('777');
    cy.get('input[formControlName="companyAddress"]').type('Beograd 2');

    cy.contains('button', 'Kreiraj račun').should('be.enabled').click();

    cy.wait('@createAccount').its('request.body').should((body) => {
      // API expects currencyCode and tipRacuna on DTO for FX accounts according to interface
      expect(body.currencyCode).to.equal('EUR');
      expect(body.initialBalance).to.equal(2500);

      expect(body.firma).to.deep.equal({
        naziv: 'Devizna Firma',
        maticniBroj: '12345678',
        poreskiBroj: '123456789',
        sifraDelatnosti: '777',
        adresa: 'Beograd 2',
        vlasnik: 1
      });

      expect(body.idVlasnika).to.exist;
    });
  });

  it('prikazuje company polja samo za poslovnog vlasnika', () => {
  cy.get('select[formControlName="kind"]').select('Devizni');
  cy.get('select[formControlName="currency"]').select('EUR');
  cy.get('select').filter(':visible').eq(2).select('Lični');

  cy.contains('button', 'Dalje').click();
  cy.contains('Korak 2 - Vlasnik', { timeout: 10000 }).should('be.visible');

  cy.contains('Podaci o firmi').should('not.exist');

  cy.contains('button', 'Nazad').click();

  cy.get('select[formControlName="kind"]').select('Devizni');
  cy.get('select[formControlName="currency"]').select('EUR');
  cy.get('select').filter(':visible').eq(2).select('Poslovni');

  cy.contains('button', 'Dalje').click();
  cy.contains('Korak 2 - Vlasnik', { timeout: 10000 }).should('be.visible');

  cy.contains('Podaci o firmi').should('be.visible');
  cy.get('input[formControlName="companyName"]').should('be.visible');
});

it('ne dozvoljava devizni račun bez izbora valute', () => {
  cy.get('select[formControlName="kind"]').select('Devizni');

  cy.get('select[formControlName="currency"]').should('be.visible');
  cy.contains('button', 'Dalje').click();

  cy.contains('Korak 2 - Vlasnik').should('not.exist');
});

  it('TEKUCI flow omogućava Novi klijent i vraća korisnika nazad na formu', () => {
    // Intercept kreiranja klijenta unutar `user-create.component`
    cy.intercept('POST', '**/clients/customers*', {
      statusCode: 201,
      body: {
        id: 'new-client-id',
        ime: 'Test',
        prezime: 'Klijent',
        email: 'test@test.com'
      }
    }).as('createUser');

    // Korak 1
    cy.get('select[formControlName="kind"]').should('be.visible').select('Tekući');

    // subtype možda postoji tek za tekući račun
    cy.get('body').then(($body) => {
      const subtype = $body.find('select[formControlName="subtype"]');
      if (subtype.length) {
        cy.wrap(subtype).select(1);
      }
    });

    cy.contains('button', 'Dalje').should('be.enabled').click();

    // Korak 2
    cy.contains('Korak 2 - Vlasnik', { timeout: 10000 }).should('be.visible');

    cy.contains('button', 'Novi klijent').should('be.visible').click();

    cy.url({ timeout: 10000 }).should('include', '/users/new');

    // Popuni minimalno što forma traži (nova struktura polja na angular form grupi)
    cy.get('input[name="firstName"], input[formControlName="firstName"]').type('Test');
    cy.get('input[name="lastName"], input[formControlName="lastName"]').type('Klijent');
    cy.get('input[name="email"], input[formControlName="email"]').type('test@test.com');
    cy.get('input[name="phone"], input[formControlName="phone"]').type('064123456');
    cy.get('input[name="jmbg"], input[formControlName="jmbg"]').type('1234567890123');
    cy.get('input[name="address"], input[formControlName="address"]').type('Neka adresa 10');
    cy.get('input[name="dateOfBirth"], input[formControlName="dateOfBirth"]').type('1990-01-01');
    cy.get('select[name="gender"], select[formControlName="gender"]').select('M');

    // Potvrdi modal formu za novog klijenta - komponenta ga ima kao "Kreiraj"
    cy.contains('button', 'Kreiraj').click();

    cy.wait('@createUser');

    cy.url({ timeout: 10000 }).should('include', '/accounts/new');
    cy.contains('Korak 2 - Vlasnik', { timeout: 10000 }).should('be.visible');

    cy.get('select[formControlName="ownerId"]', { timeout: 10000 })
      .should('be.visible')
      .invoke('val')
      .should('not.be.empty');
  });

  it('štiti rutu ako korisnik nije ulogovan', () => {
    cy.visit(route, {
      onBeforeLoad(win) {
        win.localStorage.clear();
      },
    });

    cy.url({ timeout: 10000 }).should('include', '/login');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountCardsPlaceholderComponent } from './account-cards-placeholder.component';

describe('AccountCardsPlaceholderComponent', () => {
  let component: AccountCardsPlaceholderComponent;
  let fixture: ComponentFixture<AccountCardsPlaceholderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AccountCardsPlaceholderComponent]
    });
    fixture = TestBed.createComponent(AccountCardsPlaceholderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionDetailModalComponent } from './transaction-detail-modal.component';

describe('TransactionDetailModalComponent', () => {
  let component: TransactionDetailModalComponent;
  let fixture: ComponentFixture<TransactionDetailModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransactionDetailModalComponent]
    });
    fixture = TestBed.createComponent(TransactionDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

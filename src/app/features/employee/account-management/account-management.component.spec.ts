import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AccountManagementComponent } from './account-management.component';
import { AccountService } from '../../client/services/account.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Account } from '../../client/models/account.model';

const mockAccounts: Account[] = [
  {
    id: 1,
    name: 'Basik',
    accountNumber: '265000000001111111',
    balance: 1000,
    availableBalance: 900,
    reservedFunds: 100,
    currency: 'RSD',
    status: 'ACTIVE',
    subtype: 'STANDARD',
    ownerId: 1,
    ownerName: 'Jovan Jovanovic',
    employeeId: 1,
    maintenanceFee: 0,
    dailyLimit: 100000,
    monthlyLimit: 500000,
    dailySpending: 0,
    monthlySpending: 0,
    createdAt: '2024-01-01T00:00:00',
    expiryDate: '2034-01-01T00:00:00'
  }
];

describe('AccountManagementComponent', () => {
  let component: AccountManagementComponent;
  let fixture: ComponentFixture<AccountManagementComponent>;

  beforeEach(() => {
    const accountServiceStub = {
      getAllAccounts: () => of(mockAccounts),
      updateAccountStatus: () => of(void 0)
    };
    const toastServiceStub = {
      success: () => {},
      error: () => {}
    };

    TestBed.configureTestingModule({
      declarations: [AccountManagementComponent],
      providers: [
        { provide: AccountService, useValue: accountServiceStub },
        { provide: ToastService, useValue: toastServiceStub }
      ]
    });

    fixture = TestBed.createComponent(AccountManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load and filter accounts', () => {
    expect(component.accounts.length).toBe(1);
    expect(component.filteredAccounts.length).toBe(1);

    component.searchOwner = 'nepostojece';
    component.onSearchOwner();
    expect(component.filteredAccounts.length).toBe(0);
  });
});

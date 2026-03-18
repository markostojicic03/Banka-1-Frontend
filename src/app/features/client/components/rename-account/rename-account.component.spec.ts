import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenameAccountComponent } from './rename-account.component';

describe('RenameAccountComponent', () => {
  let component: RenameAccountComponent;
  let fixture: ComponentFixture<RenameAccountComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RenameAccountComponent]
    });
    fixture = TestBed.createComponent(RenameAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

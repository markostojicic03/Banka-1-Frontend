import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Account } from '../../models/account.model';
import { AccountService } from '../../services/account.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rename-account-modal',
  templateUrl: './rename-account.component.html', 
  styleUrls: ['./rename-account.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class RenameAccountComponent implements OnInit {
  @Input() account!: Account; // Račun koji menjamo
  @Input() allAccounts: Account[] = []; // Svi računi za proveru unikatnosti
  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<string>();

  renameForm: FormGroup;

  constructor(private fb: FormBuilder, private accountService: AccountService) {
    this.renameForm = this.fb.group({
      newName: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const newNameControl = this.renameForm.get('newName');
    
    if (newNameControl) {
      // Umesto da prosleđujemo fiksne stringove, prosleđujemo referencu na metodu
      // Tako validator uvek ima najsvežije podatke iz @Input-a
      newNameControl.setValidators([
        Validators.required,
        (control: AbstractControl) => this.sameNameValidator(control),
        (control: AbstractControl) => this.uniqueNameValidator(control)
      ]);
      
      // Forsiramo Angular da proveri validnost odmah pri otvaranju modala
      newNameControl.updateValueAndValidity();
    }
  }

  // Validacija 1: Novo ime ne sme biti isto kao trenutno (ignorise velika/mala slova i razmake)
  sameNameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value || !this.account) return null;
    
    const newName = control.value.trim().toLowerCase();
    const currentName = this.account.name.trim().toLowerCase();
    
    return newName === currentName ? { sameName: true } : null;
  }

  // Validacija 2: Novo ime ne sme postojati među drugim računima istog klijenta
  uniqueNameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value || !this.allAccounts || this.allAccounts.length === 0) return null;
    
    const newName = control.value.trim().toLowerCase();
    
    // Tražimo da li postoji račun sa ISTIM imenom, a da to NIJE trenutni račun
    const exists = this.allAccounts.some(
      a => a.name.trim().toLowerCase() === newName && a.id !== this.account.id
    );
    
    return exists ? { nameExists: true } : null;
  }

  onConfirm(): void {
    if (this.renameForm.valid) {
      // Trimujemo pre slanja na backend da ne bismo slali prazna mesta
      const newName = this.renameForm.value.newName.trim(); 
      this.accountService.renameAccount(this.account.id, newName).subscribe(() => {
        this.updated.emit(newName);
        this.onCancel();
      });
    }
  }

  onCancel(): void {
    this.closed.emit();
  }
}
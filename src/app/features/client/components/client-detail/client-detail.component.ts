import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClientService } from '../../services/client.service';

@Component({
  selector: 'app-client-detail',
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class ClientDetailComponent implements OnInit {
  clientForm: FormGroup;
  clientId: string | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  backendEmailError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService
  ) {
    this.clientForm = this.fb.group({
      ime: ['', Validators.required],
      prezime: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      brojTelefona: ['', Validators.required],
      adresa: ['', Validators.required],
      jmbg: [{ value: '', disabled: true }]
    });
  }


  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id');
    if (this.clientId) {
      this.fetchClientDetails();
    }
  }

fetchClientDetails(): void {
  if (!this.clientId) return;

  this.isLoading = true;
  this.errorMessage = null;

  this.clientService.getClientById(this.clientId).subscribe({
    next: (client: any) => {
      console.log('Podaci stigli:', client);
      this.clientForm.patchValue(client);
      this.isLoading = false;
    },
    error: (err: any) => {
      console.error('Servis je vratio grešku:', err);
      this.errorMessage = 'Neuspešno učitavanje podataka klijenta.';
      this.isLoading = false;
    }
  });
}

onSubmit(): void {
  if (this.clientForm.valid && this.clientId) {
    this.isLoading = true;
    this.backendEmailError = null;

    const updateData = this.clientForm.getRawValue();

    this.clientService.updateClient(this.clientId, updateData).subscribe({
      next: () => {
        this.router.navigate(['/clients']);
      },
      error: (err: any) => {
        this.isLoading = false;
        if (err.status === 400 && err.error?.message?.includes('email')) {
          this.backendEmailError = 'Ovaj email je već zauzet.';
          this.clientForm.get('email')?.setErrors({ notUnique: true });
        } else {
          this.errorMessage = 'Greška pri čuvanju izmena.';
        }
      }
    });
  }
}

  onCancel(): void {
    this.router.navigate(['/clients']);
  }
}

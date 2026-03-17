import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientRoutingModule } from './client-routing.module';
import { AccountListComponent } from './components/account-list/account-list.component';

@NgModule({
  declarations: [
    AccountListComponent
  ],
  imports: [
    CommonModule,
    ClientRoutingModule
  ]
})
export class ClientModule {}

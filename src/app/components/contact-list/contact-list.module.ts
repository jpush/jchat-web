import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { ContactListComponent } from './contact-list.component';
import { BadgeModule } from 'jpush-ui/badge';

@NgModule({
  declarations: [
    ContactListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    BadgeModule
  ],
  exports: [
      ContactListComponent
  ],
  providers: []
})

export class ContactListModule {}
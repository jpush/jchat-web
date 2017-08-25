import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { ContactListComponent } from './contact-list.component';
import { BadgePipeModule } from '../../pipes';

@NgModule({
  declarations: [
    ContactListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    BadgePipeModule
  ],
  exports: [
      ContactListComponent
  ],
  providers: []
})
export class ContactListModule {}
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { ContactListComponent } from './contact-list.component';

@NgModule({
  declarations: [
    ContactListComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      ContactListComponent
  ],
  providers: []
})
export class ContactListModule {}
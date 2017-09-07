import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { datePipe } from './date.pipe';

@NgModule({
  declarations: [
    datePipe
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      datePipe
  ],
  providers: []
})
export class datePipeModule {}

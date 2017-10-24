import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { DatePipe } from './date.pipe';

@NgModule({
  declarations: [
    DatePipe
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      DatePipe
  ],
  providers: []
})
export class DatePipeModule {}

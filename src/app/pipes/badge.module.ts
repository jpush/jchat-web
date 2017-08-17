import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { BadgePipe } from './badge.pipe';

@NgModule({
  declarations: [
    BadgePipe
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      BadgePipe
  ],
  providers: []
})
export class BadgePipeModule {}

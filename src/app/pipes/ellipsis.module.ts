import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { EllipsisPipe } from './ellipsis.pipe';

@NgModule({
  declarations: [
    EllipsisPipe
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      EllipsisPipe
  ],
  providers: []
})
export class EllipsisPipeModule {}

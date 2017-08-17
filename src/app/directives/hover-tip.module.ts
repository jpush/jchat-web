import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { HoverEventDirective } from './hover-tip.directive';

@NgModule({
  declarations: [
    HoverEventDirective
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      HoverEventDirective
  ],
  providers: []
})
export class HoverEventModule {}

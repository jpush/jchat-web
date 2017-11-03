import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { HoverTipComponent } from './hover-tip.component';

@NgModule({
  declarations: [
    HoverTipComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      HoverTipComponent
  ],
  providers: []
})

export class HoverTipModule {}
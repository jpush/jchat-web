import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { OtherInfoComponent } from './other-info.component';
import { HoverTipModule } from '../hover-tip';
import { HoverEventModule } from '../../directives';
import { EllipsisPipeModule, SanitizePipeModule } from '../../pipes';

@NgModule({
  declarations: [
    OtherInfoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HoverTipModule,
    HoverEventModule,
    EllipsisPipeModule,
    SanitizePipeModule
  ],
  exports: [
      OtherInfoComponent
  ],
  providers: []
})
export class OtherInfoModule {}
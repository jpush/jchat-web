import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { EmojiComponent } from './emoji.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { EmojiPipeModule, SanitizePipeModule } from '../../pipes';

@NgModule({
  declarations: [
    EmojiComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PerfectScrollbarModule.forRoot(PERFECT_SCROLLBAR_CONFIG),
    EmojiPipeModule,
    SanitizePipeModule
  ],
  exports: [
      EmojiComponent
  ],
  providers: []
})
export class EmojiModule {}
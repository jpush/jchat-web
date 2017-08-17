import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';

import { ConversationListComponent } from './conversation-list.component';
import { DayPipeModule, EmojiPipeModule, TimePipeModule,
        BadgePipeModule, SanitizePipeModule } from '../../pipes';

@NgModule({
  declarations: [
    ConversationListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PerfectScrollbarModule.forRoot(PERFECT_SCROLLBAR_CONFIG),
    DayPipeModule,
    EmojiPipeModule,
    TimePipeModule,
    BadgePipeModule,
    SanitizePipeModule
  ],
  exports: [
      ConversationListComponent
  ],
  providers: []
})
export class ConversationListModule {}
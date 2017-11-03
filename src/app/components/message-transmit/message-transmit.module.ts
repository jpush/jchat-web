import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { MessageTransmitComponent } from './message-transmit.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { SearchMemberModule } from '../search-member';
import { SanitizePipeModule } from '../../pipes';
import { SearchTransmitModule } from '../search-transmit';

@NgModule({
  declarations: [
    MessageTransmitComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
     PerfectScrollbarModule.forRoot(PERFECT_SCROLLBAR_CONFIG),
     SearchMemberModule,
     SanitizePipeModule,
     SearchTransmitModule
  ],
  exports: [
      MessageTransmitComponent
  ],
  providers: []
})

export class MessageTransmitModule {}

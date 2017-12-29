import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { MessageTransmitComponent } from './message-transmit.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { SearchMemberModule } from '../search-member';
import { SearchTransmitModule } from '../search-transmit';
import { SharedPipeModule } from '../../pipes';
import { SharedDirectiveModule } from '../../directives';

@NgModule({
    declarations: [
        MessageTransmitComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        PerfectScrollbarModule.forRoot(PERFECT_SCROLLBAR_CONFIG),
        SearchMemberModule,
        SharedPipeModule,
        SearchTransmitModule,
        SharedDirectiveModule
    ],
    exports: [
        MessageTransmitComponent
    ],
    providers: []
})

export class MessageTransmitModule { }

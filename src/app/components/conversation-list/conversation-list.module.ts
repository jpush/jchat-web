import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { ConversationListComponent } from './conversation-list.component';
import { BadgeModule } from 'jpush-ui/badge';
import { SharedPipeModule } from '../../pipes';
import { SharedDirectiveModule } from '../../directives';

@NgModule({
    declarations: [
        ConversationListComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        PerfectScrollbarModule.forRoot(PERFECT_SCROLLBAR_CONFIG),
        SharedPipeModule,
        BadgeModule,
        SharedDirectiveModule
    ],
    exports: [
        ConversationListComponent
    ],
    providers: []
})

export class ConversationListModule { }

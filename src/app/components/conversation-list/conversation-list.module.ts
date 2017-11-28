import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { ConversationListComponent } from './conversation-list.component';
import { DayPipeModule, EmojiPipeModule, TimePipeModule,
         SanitizePipeModule } from '../../pipes';
import { BadgeModule } from 'jpush-ui/badge';
import { AvatarLoadModule, AvatarErrorModule } from '../../directives';

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
        SanitizePipeModule,
        BadgeModule,
        AvatarLoadModule,
        AvatarErrorModule
    ],
    exports: [
        ConversationListComponent
    ],
    providers: []
})

export class ConversationListModule {}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { ChatPanelComponent } from './chat-panel.component';
// import {
//     MyModelDirective,
//     HoverEventModule,
//     AvatarLoadModule,
//     AvatarErrorModule
// } from '../../directives';
import { EmojiModule } from '../emoji';
import { HoverTipModule } from '../hover-tip';
import { ImageViewerModule } from '../image-viewer';
import { StorageService } from '../../services/common';
import { MessageMenuModule } from '../message-menu';
import { PasteImageModule } from '../paste-image';
import { DropFileModule } from '../drop-file';
import { AtListModule } from '../../components/at-list';
import { MessageFileModule } from '../../components/message-file';
import { CardModalModule } from '../../components/card-modal';
import { SharedPipeModule } from '../../pipes';
import { SharedDirectiveModule } from '../../directives';

@NgModule({
    declarations: [
        ChatPanelComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        PerfectScrollbarModule.forRoot(PERFECT_SCROLLBAR_CONFIG),
        EmojiModule,
        RouterModule,
        HoverTipModule,
        ImageViewerModule,
        MessageMenuModule,
        PasteImageModule,
        DropFileModule,
        AtListModule,
        SharedPipeModule,
        MessageFileModule,
        CardModalModule,
        SharedDirectiveModule
    ],
    exports: [
        ChatPanelComponent
    ],
    providers: [
        StorageService
    ]
})

export class ChatPanelModule { }

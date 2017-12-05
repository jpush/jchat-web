import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RoomPanelComponent } from './room-panel.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
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
        RoomPanelComponent
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
        RoomPanelComponent
    ],
    providers: []
})

export class RoomPanelModule {}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RoomPanelComponent } from './room-panel.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import {
    DayPipeModule,
    EmojiPipeModule,
    EllipsisPipeModule,
    TimePipeModule,
    FloorPipeModule,
    FileTypePipeModule,
    FileSizePipeModule,
    VideoTimePipeModule,
    SanitizePipeModule,
    FileNamePipeModule
} from '../../pipes';
import {
    MyModelDirective,
    AvatarLoadModule,
    AvatarErrorModule
} from '../../directives';
import { EmojiModule } from '../emoji';
import { HoverTipModule } from '../hover-tip';
import { HoverEventModule } from '../../directives';
import { ImageViewerModule } from '../image-viewer';
import { StorageService } from '../../services/common';
import { MessageMenuModule } from '../message-menu';
import { PasteImageModule } from '../paste-image';
import { DropFileModule } from '../drop-file';
import { AtListModule } from '../../components/at-list';
import { MessageFileModule } from '../../components/message-file';
import { CardModalModule } from '../../components/card-modal';

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
        HoverEventModule,
        DayPipeModule,
        ImageViewerModule,
        EmojiPipeModule,
        EllipsisPipeModule,
        TimePipeModule,
        FloorPipeModule,
        FileTypePipeModule,
        FileSizePipeModule,
        VideoTimePipeModule,
        SanitizePipeModule,
        MessageMenuModule,
        PasteImageModule,
        DropFileModule,
        AtListModule,
        FileNamePipeModule,
        MessageFileModule,
        CardModalModule,
        AvatarLoadModule,
        AvatarErrorModule
    ],
    exports: [
        RoomPanelComponent
    ],
    providers: []
})

export class RoomPanelModule {}

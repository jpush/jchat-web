import { NgModule } from '@angular/core';
import { MyDatePipe } from './date.pipe';
import { DayPipe } from './day.pipe';
import { EllipsisPipe } from './ellipsis.pipe';
import { EmojiPipe } from './emoji.pipe';
import { FileNamePipe } from './file-name.pipe';
import { FileSizePipe } from './file-size.pipe';
import { FileTypePipe } from './file-type.pipe';
import { FloorPipe } from './floor.pipe';
import { SanitizePipe } from './sanitize.pipe';
import { TimePipe } from './time.pipe';
import { VideoTimePipe } from './video-time.pipe';

/**
 * 共享模块，导出所有管道
 */

@NgModule({
    declarations: [
        MyDatePipe,
        DayPipe,
        EllipsisPipe,
        EmojiPipe,
        FileNamePipe,
        FileSizePipe,
        FileTypePipe,
        FloorPipe,
        SanitizePipe,
        TimePipe,
        VideoTimePipe
    ],
    imports: [
        // pass
    ],
    exports: [
        MyDatePipe,
        DayPipe,
        EllipsisPipe,
        EmojiPipe,
        FileNamePipe,
        FileSizePipe,
        FileTypePipe,
        FloorPipe,
        SanitizePipe,
        TimePipe,
        VideoTimePipe
    ],
    providers: []
})

export class SharedPipeModule { }

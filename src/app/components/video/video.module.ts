import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { VideoComponent } from './video.component';
import { VideoTimePipeModule, SanitizePipeModule } from '../../pipes';

@NgModule({
    declarations: [
        VideoComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        VideoTimePipeModule,
        SanitizePipeModule
    ],
    exports: [
        VideoComponent
    ],
    providers: []
})

export class VideoModule {}

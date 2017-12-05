import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { VideoComponent } from './video.component';
import { SharedPipeModule } from '../../pipes';

@NgModule({
    declarations: [
        VideoComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        SharedPipeModule
    ],
    exports: [
        VideoComponent
    ],
    providers: []
})

export class VideoModule {}

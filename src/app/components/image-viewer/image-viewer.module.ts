import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { ImageViewerComponent } from './image-viewer.component';
import { SharedPipeModule } from '../../pipes';

@NgModule({
    declarations: [
        ImageViewerComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        SharedPipeModule
    ],
    exports: [
        ImageViewerComponent
    ],
    providers: []
})

export class ImageViewerModule {}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { PasteImageComponent } from './paste-image.component';

@NgModule({
    declarations: [
        PasteImageComponent
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        PasteImageComponent
    ],
    providers: []
})

export class PasteImageModule {}

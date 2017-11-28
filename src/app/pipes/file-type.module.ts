import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { FileTypePipe } from './file-type.pipe';

@NgModule({
    declarations: [
        FileTypePipe
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        FileTypePipe
    ],
    providers: []
})
export class FileTypePipeModule {}

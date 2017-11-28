import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { DropFileComponent } from './drop-file.component';
import { FileTypePipeModule, FileSizePipeModule } from '../../pipes';

@NgModule({
    declarations: [
        DropFileComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        FileTypePipeModule,
        FileSizePipeModule
    ],
    exports: [
        DropFileComponent
    ],
    providers: []
})

export class DropFileModule {}

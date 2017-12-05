import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { DropFileComponent } from './drop-file.component';
import { SharedPipeModule } from '../../pipes';

@NgModule({
    declarations: [
        DropFileComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        SharedPipeModule
    ],
    exports: [
        DropFileComponent
    ],
    providers: []
})

export class DropFileModule {}

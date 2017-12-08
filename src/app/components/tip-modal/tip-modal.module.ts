import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { TipModalComponent } from './tip-modal.component';

@NgModule({
    declarations: [
        TipModalComponent
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        TipModalComponent
    ],
    providers: []
})

export class TipModalModule { }

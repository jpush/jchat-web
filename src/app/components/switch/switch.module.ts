import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { SwitchComponent } from './switch.component';
import { SharedDirectiveModule } from '../../directives';

@NgModule({
    declarations: [
        SwitchComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        SharedDirectiveModule
    ],
    exports: [
        SwitchComponent
    ],
    providers: []
})

export class SwitchModule {}

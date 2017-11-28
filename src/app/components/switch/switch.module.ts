import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { SwitchComponent } from './switch.component';

@NgModule({
    declarations: [
        SwitchComponent
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        SwitchComponent
    ],
    providers: []
})

export class SwitchModule {}

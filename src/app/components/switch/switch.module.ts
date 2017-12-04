import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { SwitchComponent } from './switch.component';
import { DebounceClickDirective } from '../../directives';

@NgModule({
    declarations: [
        SwitchComponent,
        DebounceClickDirective
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

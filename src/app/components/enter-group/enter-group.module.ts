import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { EnterGroupComponent } from './enter-group.component';

@NgModule({
    declarations: [
        EnterGroupComponent
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        EnterGroupComponent
    ],
    providers: []
})

export class EnterGroupModule {}

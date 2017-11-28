import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { ModifyPasswordComponent } from './modify-password.component';

@NgModule({
    declarations: [
        ModifyPasswordComponent
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        ModifyPasswordComponent
    ],
    providers: []
})

export class ModifyPasswordModule {}

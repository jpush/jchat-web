import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { SanitizePipe } from './sanitize.pipe';

@NgModule({
    declarations: [
        SanitizePipe
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        SanitizePipe
    ],
    providers: []
})
export class SanitizePipeModule {}

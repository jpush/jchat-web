import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { AvatarErrorDirective } from './avatar-error.directive';

@NgModule({
    declarations: [
        AvatarErrorDirective
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        AvatarErrorDirective
    ],
    providers: []
})

export class AvatarErrorModule {}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { AvatarLoadDirective } from './avatar-load.directive';

@NgModule({
    declarations: [
        AvatarLoadDirective
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        AvatarLoadDirective
    ],
    providers: []
})

export class AvatarLoadModule {}

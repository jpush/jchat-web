import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { DebounceClickDirective } from './debounce-click.directive';
import { MyModelDirective } from './my-model.directive';
import { AvatarErrorDirective } from './avatar-error.directive';
import { AvatarLoadDirective } from './avatar-load.directive';
import { HoverEventDirective } from './hover-tip.directive';

@NgModule({
    declarations: [
        DebounceClickDirective,
        MyModelDirective,
        AvatarErrorDirective,
        AvatarLoadDirective,
        HoverEventDirective
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        DebounceClickDirective,
        MyModelDirective,
        AvatarErrorDirective,
        AvatarLoadDirective,
        HoverEventDirective
    ],
    providers: []
})

export class SharedDirectiveModule {}

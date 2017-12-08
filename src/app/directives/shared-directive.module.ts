import { NgModule } from '@angular/core';
import { DebounceClickDirective } from './debounce-click.directive';
import { MyModelDirective } from './my-model.directive';
import { AvatarErrorDirective } from './avatar-error.directive';
import { AvatarLoadDirective } from './avatar-load.directive';
import { HoverEventDirective } from './hover-tip.directive';

/**
 * 共享模块，导出所有指令
 */

@NgModule({
    declarations: [
        DebounceClickDirective,
        MyModelDirective,
        AvatarErrorDirective,
        AvatarLoadDirective,
        HoverEventDirective
    ],
    imports: [
        // pass
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

export class SharedDirectiveModule { }

import { Directive, HostListener } from '@angular/core';
import { Util } from '../services/util';

/**
 * 对头像的宽高进行限制
 */

@Directive({ selector: '[avatarLoad]' })

export class AvatarLoadDirective {
    constructor() {
        //    pass
    }
    @HostListener('load', ['$event']) private onLoad(event) {
        Util.reduceAvatarSize(event);
    }
}

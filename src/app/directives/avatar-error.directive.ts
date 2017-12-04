import { Directive, Input, HostListener } from '@angular/core';
const singleAvatarErrorIcon = '../../../assets/images/single-avatar.svg';
const groupAvatarErrorIcon = '../../../assets/images/group-avatar.svg';

/**
 * 群组或单聊默认头像
 */

@Directive({ selector: '[avatarError]' })

export class AvatarErrorDirective {
    @Input()
        private avatarError;
    constructor() {
        //    pass
    }
    @HostListener('error', ['$event']) private onError(event) {
        /**
         * group    4
         * single   3
         */
        if (this.avatarError === 4) {
            event.target.src = groupAvatarErrorIcon;
        } else if (this.avatarError === 3) {
            event.target.src = singleAvatarErrorIcon;
        }
    }
}

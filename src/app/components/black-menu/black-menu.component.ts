import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Util } from '../../services/util';
const avatarErrorIcon = '../../../assets/images/single-avatar.svg';

@Component({
    selector: 'black-menu-component',
    templateUrl: './black-menu.component.html',
    styleUrls: ['./black-menu.component.scss']
})

export class BlackMenuComponent implements OnInit {
    @Input()
        private menuInfo;
    @Output()
        private blockMenuConfirm: EventEmitter<any> = new EventEmitter();
    @Output()
        private delSingleBlack: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
     }
    public ngOnInit() {
        // pass
    }
    private blockMenuEmit() {
        this.blockMenuConfirm.emit();
    }
    private avatarErrorIcon(event) {
        event.target.src = avatarErrorIcon;
    }
    private delSingleBlackAction(item) {
        this.delSingleBlack.emit(item);
    }
    private avatarLoad(event) {
        Util.reduceAvatarSize(event);
    }
}

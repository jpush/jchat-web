import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

const avatarErrorIcon = '../../../assets/images/single-avatar.png';

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
        if (event.target.offsetHeight > event.target.offsetWidth) {
            event.target.style.width = '100%';
            event.target.style.height = 'auto';
        } else {
            event.target.style.height = '100%';
            event.target.style.width = 'auto';
        }
    }
}

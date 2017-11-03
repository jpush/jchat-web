import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { global } from '../../services/common';
import { Util } from '../../services/util';
const avatarErrorIcon = '../../../assets/images/single-avatar.svg';

@Component({
    selector: 'at-list-component',
    templateUrl: './at-list.component.html',
    styleUrls: ['./at-list.component.scss']
})

export class AtListComponent implements OnInit {
    @Input()
        private atList: EventEmitter<any> = new EventEmitter();
    @Output()
        private selectAtItem: EventEmitter<any> = new EventEmitter();
    private global = global;
    constructor() {
        // pass
     }
    public ngOnInit() {
        // pass
    }
    private avatarErrorIcon(event) {
        event.target.src = avatarErrorIcon;
    }
    private selectPerson(item, event) {
        this.selectAtItem.emit(item);
        event.stopPropagation();
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
    private avatarLoad(event, item) {
        Util.reduceAvatarSize(event);
    }
}

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Util } from '../../services/util';
const avatarErrorIcon = '../../../assets/images/single-avatar.svg';

@Component({
    selector: 'unread-list-component',
    templateUrl: './unread-list.component.html',
    styleUrls: ['./unread-list.component.scss']
})

export class UnreadListComponent implements OnInit {
    @Input()
        private unreadList;
    @Output()
        private readListOtherInfo: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
     }
    public ngOnInit() {
        // pass
    }
    private closeModal() {
        this.unreadList.show = false;
    }
    private avatarLoad(event, item) {
        Util.reduceAvatarSize(event);
    }
    private avatarErrorIcon(event) {
        event.target.src = avatarErrorIcon;
    }
    private watchOtherInfo(item) {
        this.readListOtherInfo.emit(item);
    }
}

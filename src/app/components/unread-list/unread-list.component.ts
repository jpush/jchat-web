import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
        if (event.target.naturalHeight >= event.target.naturalWidth) {
            event.target.style.width = '100%';
            event.target.style.height = 'auto';
        } else {
            event.target.style.height = '100%';
            event.target.style.width = 'auto';
        }
    }
    private avatarErrorIcon(event) {
        event.target.src = avatarErrorIcon;
    }
    private watchOtherInfo(item) {
        this.readListOtherInfo.emit(item);
    }
}

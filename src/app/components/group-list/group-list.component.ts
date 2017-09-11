import { Component, OnInit, Input, Output, EventEmitter, DoCheck } from '@angular/core';
const groupAvatarErrorIcon = '../../../assets/images/group-avatar.svg';

@Component({
    selector: 'group-list-component',
    templateUrl: './group-list.component.html',
    styleUrls: ['./group-list.component.scss']
})

export class GroupListComponent implements OnInit, DoCheck {
    @Input()
        private groupList;
    @Output()
        private selectGroupItemEmit: EventEmitter<any> = new EventEmitter();
    private isEmpty = false;
    constructor() {
        // pass
    }
    public ngOnInit() {
        if (!this.groupList) {
            this.groupList = [];
        }
    }
    public ngDoCheck() {
        for (let item of this.groupList) {
            if (item.data.length > 0) {
                this.isEmpty = true;
                break;
            }
        }
    }
    private selectGroupItem(item) {
        this.selectGroupItemEmit.emit(item);
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
    private groupAvatarErrorIcon(event) {
        event.target.src = groupAvatarErrorIcon;
    }
}

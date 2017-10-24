import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'group-avatar-component',
    templateUrl: './group-avatar.component.html',
    styleUrls: ['./group-avatar.component.scss']
})

export class GroupAvatarComponent implements OnInit {
    @Input()
        private groupAvatarInfo;
    @Output()
        private groupAvatar: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
     }
    public ngOnInit() {
        // pass
    }
    private modalAction(event, type ?) {
        event.stopPropagation();
        this.groupAvatarInfo.show = false;
        if (type) {
            this.groupAvatar.emit(this.groupAvatarInfo);
        }
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
}

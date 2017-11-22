import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Util } from '../../services/util';
const groupAvatarErrorIcon = '../../../assets/images/group-avatar.svg';

@Component({
    selector: 'group-info-component',
    templateUrl: './group-info.component.html',
    styleUrls: ['./group-info.component.scss']
})

export class GroupInfoComponent implements OnInit {
    @Input()
        private groupInfo;
    @Output()
        private applyEnterGroup: EventEmitter<any> = new EventEmitter();
    @Output()
        private changeGroupConversation: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    private groupInfoClose() {
        this.groupInfo.show = false;
    }
    private groupAvatarErrorIcon(event) {
        event.target.src = groupAvatarErrorIcon;
    }
    private avatarLoad(event) {
        Util.reduceAvatarSize(event);
    }
    private applyEnterGroupAction() {
        this.applyEnterGroup.emit(this.groupInfo.info);
    }
    private changeGroupConversationAction() {
        let group = {
            appkey: this.groupInfo.info.appkey,
            avatar: this.groupInfo.info.avatar,
            avatarUrl: this.groupInfo.info.avatarUrl,
            ctime: this.groupInfo.info.ctime,
            desc: this.groupInfo.info.desc,
            flag: this.groupInfo.info.flag,
            gid: this.groupInfo.info.gid,
            max_member_count: this.groupInfo.info.max_member_count,
            mtime: this.groupInfo.info.mtime,
            name: this.groupInfo.info.name,
            type: 4
        };
        this.groupInfo.show = false;
        this.changeGroupConversation.emit(group);
    }
}

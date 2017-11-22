import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Util } from '../../services/util';
const groupAvatarErrorIcon = '../../../assets/images/group-avatar.svg';

@Component({
    selector: 'create-group-next-component',
    templateUrl: './create-group-next.component.html',
    styleUrls: ['./create-group-next.component.scss']
})

export class CreateGroupNextComponent implements OnInit {
    @Input()
        private groupAvatarInfo;
    @Input()
        private createGroupNext;
    @Output()
        private changeCreateGroupAvatar: EventEmitter<any> = new EventEmitter();
    @Output()
        private createGroupPrev: EventEmitter<any> = new EventEmitter();
    @Output()
        private closeCreateGroupNext: EventEmitter<any> = new EventEmitter();
    @Output()
        private completeCreateGroup: EventEmitter<any> = new EventEmitter();
    private nameTip = '';
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    private groupAvatarErrorIcon(event) {
        event.target.src = groupAvatarErrorIcon;
    }
    private avatarLoad(event) {
        Util.reduceAvatarSize(event);
    }
    private changeCreateGroupAvatarAction(event) {
        this.changeCreateGroupAvatar.emit(event.target);
    }
    private createGroupPrevAction() {
        this.createGroupPrev.emit();
    }
    private closeCreateGroupNextAction() {
        this.closeCreateGroupNext.emit();
    }
    private groupNameKeyup() {
        this.nameTip = '';
    }
    private completeCreateGroupAction(groupName, groupType) {
        if (groupName.value.length === 0) {
            this.nameTip = '群名称不能为空';
            return ;
        } else {
            let groupInfo = {
                avatar: this.groupAvatarInfo.formData,
                avatarUrl: this.groupAvatarInfo.src,
                isLimit: groupType,
                groupName: groupName.value,
                memberUsernames: this.createGroupNext.info.memberUsernames
            };
            this.completeCreateGroup.emit(groupInfo);
        }
    }
}

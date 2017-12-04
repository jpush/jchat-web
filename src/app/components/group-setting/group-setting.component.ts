import { Component, OnInit, Input, Output, EventEmitter, ViewChild,
    HostListener, ElementRef, DoCheck } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppStore } from '../../app.store';
import { chatAction } from '../../pages/chat/actions';
import { global } from '../../services/common';
import { SearchMemberComponent } from '../search-member/search-member.component';

@Component({
    selector: 'group-setting-component',
    templateUrl: './group-setting.component.html',
    styleUrls: ['./group-setting.component.scss']
})

export class GroupSettingComponent implements OnInit, DoCheck {
    @ViewChild('groupSettingHeader') private groupSettingHeader;
    @ViewChild(SearchMemberComponent) private SearchMemberComponent;
    @Input()
        private groupSetting;
    @Output()
        private closeGroupSetting: EventEmitter<any> = new EventEmitter();
    @Output()
        private exitGroup: EventEmitter<any> = new EventEmitter();
    @Output()
        private modifyGroupDescription: EventEmitter<any> = new EventEmitter();
    @Output()
        private addMember: EventEmitter<any> = new EventEmitter();
    @Output()
        private searchGroupMember: EventEmitter<any> = new EventEmitter();
    @Output()
        private watchOtherInfo: EventEmitter<any> = new EventEmitter();
    @Output()
        private watchSelfInfo: EventEmitter<any> = new EventEmitter();
    @Output()
        private deleteMember: EventEmitter<any> = new EventEmitter();
    @Output()
        private modifyGroupName: EventEmitter<any> = new EventEmitter();
    @Output()
        private updateGroupAvatar: EventEmitter<any> = new EventEmitter();
    @Output()
        private keepSilence: EventEmitter<any> = new EventEmitter();
    private global = global;
    private searchResult = {
        result: [],
        show: false,
        keywords: '',
        placeholder: '搜索群成员'
    };
    private hostHover = {
        tip: '群主',
        position: {
            left: -10,
            top: 23
        },
        show: false
    };
    private modifyGroupNameShow = false;
    private listTop = 203;
    constructor(
        private store$: Store<AppStore>,
        private elementRef: ElementRef
    ) {}
    public ngOnInit() {
        // pass
    }
    public ngDoCheck() {
        // 修改群描述时，调整群成员列表的位置
        if (this.groupSettingHeader.nativeElement) {
            this.listTop = this.groupSettingHeader.nativeElement.offsetHeight;
        }
    }
    private stopPropagation(event) {
        event.stopPropagation();
        this.searchResult.show = false;
        this.searchResult.keywords = '';
    }
    @HostListener('window:click') private onWindowClick() {
        this.groupSetting.show = false;
        this.searchResult.result = [];
        this.searchResult.show = false;
        this.closeGroupSetting.emit();
        this.SearchMemberComponent.clearKeyWords();
    }
    private clearInputEmit() {
        this.searchResult.result = [];
        this.searchResult.show = false;
    }
    private seachKeyupEmit(value) {
        this.searchResult.result = [];
        if (value) {
            this.searchResult.show = true;
            let result = [];
            for (let member of this.groupSetting.memberList) {
                const memoNameExist = member.memo_name &&
                        member.memo_name.toLowerCase().indexOf(value.toLowerCase()) !== -1;
                const usernameExist = member.username &&
                        member.username.toLowerCase().indexOf(value.toLowerCase()) !== -1;
                const nickNameExist = member.nickName &&
                        member.nickName.toLowerCase().indexOf(value.toLowerCase()) !== -1;
                if (memoNameExist || nickNameExist || usernameExist) {
                    result.push(member);
                }
            }
            this.searchResult.result = result;
        } else {
            this.searchResult.show = false;
        }
    }
    private addMemberAction() {
        this.addMember.emit();
    }
    private closeGroupSettingAction() {
        this.groupSetting.show = false;
        this.closeGroupSetting.emit();
    }
    private exitGroupAction() {
        this.exitGroup.emit(this.groupSetting.groupInfo);
    }
    private modifyGroupDescriptionAction() {
        this.modifyGroupDescription.emit();
    }
    private modifyGroupNameAction() {
        this.modifyGroupNameShow = true;
        setTimeout(() => {
            this.elementRef.nativeElement.querySelector('#groupSettingNameInput').focus();
        });
    }
    private modifyGroupNameBlur(event) {
        if (this.groupSetting.groupInfo.name !== event.target.value) {
            this.modifyGroupName.emit(event.target.value);
        }
        this.modifyGroupNameShow = false;
    }
    private changeGroupShieldEmit() {
        this.store$.dispatch({
            type: chatAction.changeGroupShield,
            payload: this.groupSetting.active
        });
    }
    private changeGroupNoDisturbEmit() {
        this.store$.dispatch({
            type: chatAction.changeGroupNoDisturb,
            payload: this.groupSetting.active
        });
    }
    private searchItemEmit(item) {
        if (item.username === global.user) {
            this.watchSelfInfo.emit();
        } else {
            this.watchOtherInfo.emit({
                username: item.username
            });
        }
        this.searchResult.result = [];
        this.searchResult.show = false;
    }
    private watchInfoAction(item) {
        if (item.username === global.user) {
            this.watchSelfInfo.emit();
        } else {
            let info: any = {
                username: item.username
            };
            if (item.hasOwnProperty('avatarUrl')) {
                info.avatarUrl = item.avatarUrl;
            }
            this.watchOtherInfo.emit(info);
        }
    }
    private deleteMemberAction(item) {
        this.deleteMember.emit(item);
    }
    private groupAvatarChange(event) {
        this.updateGroupAvatar.emit(event.target);
    }
    private keepSilenceAction(item) {
        this.keepSilence.emit(item);
    }
}

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

const avatarErrorIcon = '../../../assets/images/single-avatar.svg';

@Component({
    selector: 'verify-component',
    templateUrl: './verify.component.html',
    styleUrls: ['./verify.component.scss']
})

export class VerifyComponent implements OnInit {
    @Input()
        private verifyMessageList;
    @Output()
        private isAgreeAddFriend: EventEmitter<any>  = new EventEmitter();
    @Output()
        private watchVerifyUser: EventEmitter<any>  = new EventEmitter();
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    private avatarErrorIcon(event) {
        event.target.src = avatarErrorIcon;
    }
    private avatarLoad(event) {
        if (event.target.naturalHeight >= event.target.naturalWidth) {
            event.target.style.width = '100%';
            event.target.style.height = 'auto';
        } else {
            event.target.style.height = '100%';
            event.target.style.width = 'auto';
        }
    }
    private agreeAddFriend(message, stateType) {
        /**
         * stateType
         * 0    收到好友邀请时，同意或者拒绝按钮显示
         * 1    点击拒绝按钮的loading状态
         * 2    点击同意时的loading状态
         * 3    显示已拒绝
         * 4    显示已同意
         * 5    显示同意了您的好友请求
         * 6    显示等待对方验证
         * 7    拒绝了您的请求
         */
        if (stateType === 'refuse') {
            message.stateType = 1;
        } else if (stateType === 'agree') {
            message.stateType = 2;
        }
        this.isAgreeAddFriend.emit(message);
    }
    private verifyUser(message) {
        this.watchVerifyUser.emit(message);
    }
}

import { Component, OnInit, Input, Output, EventEmitter, OnChanges, DoCheck } from '@angular/core';

const avatarErrorIcon = '../../../assets/images/single-avatar.svg';

@Component({
    selector: 'other-info-component',
    templateUrl: './other-info.component.html',
    styleUrls: ['./other-info.component.scss']
})

export class OtherInfoComponent implements OnInit, OnChanges, DoCheck {
    @Input()
        private otherInfo;
    @Output()
        private isShow: EventEmitter<any> = new EventEmitter();
    @Output()
        private addBlackList: EventEmitter<any> = new EventEmitter();
    @Output()
        private alreadyBlack: EventEmitter<any> = new EventEmitter();
    private addBlackHover = {
        tip: '加入黑名单',
        position: {
            left: -28,
            top: 27
        },
        show: false
    };
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    public ngOnChanges() {
        switch (this.otherInfo.info.gender) {
            case 0 :
                this.otherInfo.info.gender = '保密';
                break;
            case 1 :
                this.otherInfo.info.gender = '男';
                break;
            case 2:
                this.otherInfo.info.gender = '女';
                break;
            default:
        }
    }
    public ngDoCheck() {
        if (this.otherInfo.black && this.otherInfo.info) {
            for (let item of this.otherInfo.black){
                if (item.username === this.otherInfo.info.username) {
                    this.otherInfo.info.black = 1;
                    break;
                }
            }
        }
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
    private avatarErrorIcon(event) {
        event.target.src = avatarErrorIcon;
    }
    private sendMsgBtn() {
        let user = {
            avatar: this.otherInfo.info.avatar,
            avatarUrl: this.otherInfo.info.avatarUrl,
            key: this.otherInfo.info.key || this.otherInfo.info.uid,
            mtime: this.otherInfo.info.mtime,
            name: this.otherInfo.info.username,
            nickName: this.otherInfo.info.nickname,
            type: 3
        };
        this.isShow.emit(user);
    }
    private otherClose(event) {
        event.stopPropagation();
        this.isShow.emit(false);
    }
    private addBlack() {
        if (this.otherInfo.info.black === 1) {
            this.alreadyBlack.emit();
        } else {
            this.addBlackList.emit(this.otherInfo.info);
        }
    }
    private avatarLoad(event) {
        if (event.target.naturalHeight > event.target.naturalWidth) {
            event.target.style.width = '100%';
            event.target.style.height = 'auto';
        } else {
            event.target.style.height = '100%';
            event.target.style.width = 'auto';
        }
    }
}

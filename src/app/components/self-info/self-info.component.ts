import { Component, Input, Output, EventEmitter, OnChanges, ElementRef } from '@angular/core';
const avatarErrorIcon = '../../../assets/images/single-avatar.svg';
import { Util } from '../../services/util';

@Component({
    selector: 'self-info-component',
    templateUrl: './self-info.component.html',
    styleUrls: ['./self-info.component.scss']
})

export class SelfInfoComponent implements OnChanges {
    private util: Util = new Util();
    @Input()
        private selfInfo;
    @Output()
        private isShow: EventEmitter<any> = new EventEmitter();
    @Output()
        private selectIsNotImage: EventEmitter<any> = new EventEmitter();
    private isEdit = false;
    private sexList = {
        active: {
            key: 1,
            name: '男'
        },
        list: [{
            key: 1,
            name: '男'
        }, {
            key: 2,
            name: '女'
        }, {
            key: 0,
            name: '保密'
        }],
        width: 160,
        show: false
    };
    private newInfo = {
        signature: '',
        nickname: '',
        gender: 0,
        region: ''
    };
    private newAvatar = {
        formData: {},
        url: ''
    };
    private cameraShadow = true;
    private saveLoading = false;
    constructor(
        private elementRef: ElementRef
    ) {}
    public ngOnChanges() {
        this.newInfo.signature = this.selfInfo.signature;
        this.newInfo.nickname = this.selfInfo.nickname;
        this.newInfo.gender = this.selfInfo.gender;
        this.newInfo.region = this.selfInfo.region;
        switch (this.selfInfo.gender) {
            case 0 :
                this.selfInfo.gender = '保密';
                this.sexList.active = {
                    key: 0,
                    name: '保密'
                };
                break;
            case 1 :
                this.selfInfo.gender = '男';
                this.sexList.active = {
                    key: 1,
                    name: '男'
                };
                break;
            case 2:
                this.selfInfo.gender = '女';
                this.sexList.active = {
                    key: 2,
                    name: '女'
                };
                break;
            default:
        }
    }
    private hideSelect(event) {
        event.stopPropagation();
        this.sexList.show = false;
    }
    private avatarErrorIcon(event) {
        event.target.src = avatarErrorIcon;
    }
    private selfCancel() {
        this.isEdit = false;
    }
    private selfClose(event) {
        event.stopPropagation();
        this.isShow.emit();
    }
    private signatureChange(event) {
        this.newInfo.signature = event.target.value;
    }
    private nicknameChange(event) {
        this.newInfo.nickname = event.target.value;
    }
    private regionChange(event) {
        this.newInfo.region = event.target.value;
    }
    private selfConfirm() {
        let newInfo = {
            info: Object.assign({}, this.newInfo, {gender: this.sexList.active.key}),
            avatar: this.newAvatar
        };
        this.saveLoading = true;
        this.isShow.emit(newInfo);
        setTimeout(() => {
            this.saveLoading = false;
            this.isEdit = false;
        }, 800);
    }
    private selfAvatarChange() {
        const selfAvatarImg = this.elementRef.nativeElement.querySelector('#selfAvatarImg');
        const selfAvatarInput = this.elementRef.nativeElement.querySelector('#selfAvatarInput');
        const that = this;
        if (!selfAvatarInput.files[0]) {
            return;
        }
        let imgFile = this.util.fileReader(selfAvatarInput, () => {
            that.selectIsNotImage.emit();
        });
        if (imgFile) {
            imgFile.then((url: string) => {
                selfAvatarImg.src = url;
                this.newAvatar.url = url;
                this.cameraShadow = false;
            }).catch(() => {
                console.log('Promise Rejected');
            });
        }
        this.newAvatar.formData = this.util.getFileFormData(selfAvatarInput);
    }
    private toEdit() {
        this.isEdit = true;
    }
    private avatarLoad(event) {
        if (event.target.naturalHeight >= event.target.naturalWidth) {
            event.target.style.width = '100%';
            event.target.style.height = 'auto';
        }else {
            event.target.style.height = '100%';
            event.target.style.width = 'auto';
        }
    }
}

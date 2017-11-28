import { Component, Input, Output, EventEmitter,
    OnChanges, ElementRef, AfterViewInit } from '@angular/core';
import { Util } from '../../services/util';
import { Store } from '@ngrx/store';
import { mainAction } from '../../pages/main/actions';

@Component({
    selector: 'self-info-component',
    templateUrl: './self-info.component.html',
    styleUrls: ['./self-info.component.scss']
})

export class SelfInfoComponent implements OnChanges, AfterViewInit {
    @Input()
        private selfInfo;
    // 用来标识更新个人信息成功
    @Input()
        private updateSelfInfoFlag;
    @Output()
        private isShow: EventEmitter<any> = new EventEmitter();
    @Output()
        private selectIsNotImage: EventEmitter<any> = new EventEmitter();
    @Output()
        private sendCard: EventEmitter<any> = new EventEmitter();
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
    private infoMenu = {
        info: [
            {
                name: '发送名片',
                key: 0,
                isRight: false,
                show: true
            }
        ],
        show: false
    };
    private avatarConfig = {
        info: {
            src: '',
            width: 0,
            height: 0,
            pasteFile: {}
        },
        show: false,
        formData: {},
        src: '',
        filename: '',
        title: '个人头像'
    };
    private selfAvatarImg;
    private selfAvatarInput;
    constructor(
        private elementRef: ElementRef,
        private store$: Store<any>
    ) {}
    public ngOnChanges(change) {
        this.newInfo.signature = this.selfInfo.info.signature;
        this.newInfo.nickname = this.selfInfo.info.nickname;
        this.newInfo.gender = this.selfInfo.info.gender;
        this.newInfo.region = this.selfInfo.info.region;
        this.sexActive();
        if (change.updateSelfInfoFlag) {
            this.isEdit = false;
        }
    }
    public ngAfterViewInit() {
        this.selfAvatarImg = this.elementRef.nativeElement.querySelector('#selfAvatarImg');
        this.selfAvatarInput = this.elementRef.nativeElement.querySelector('#selfAvatarInput');
    }
    private sexActive() {
        switch (this.selfInfo.info.gender) {
            case 0 :
                this.sexList.active = {
                    key: 0,
                    name: '保密'
                };
                break;
            case 1 :
                this.sexList.active = {
                    key: 1,
                    name: '男'
                };
                break;
            case 2:
                this.sexList.active = {
                    key: 2,
                    name: '女'
                };
                break;
            default:
        }
    }
    private showMenu(event) {
        event.stopPropagation();
        this.infoMenu.show = !this.infoMenu.show;
    }
    private hideSelect(event) {
        event.stopPropagation();
        this.sexList.show = false;
        this.infoMenu.show = false;
    }
    private selectMenuItemEmit() {
        this.sendCard.emit(this.selfInfo.info);
    }
    private selfCancel() {
        this.selfAvatarInput.value = '';
        this.isEdit = false;
        this.sexActive();
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
        const newInfo = {
            info: Object.assign({}, this.newInfo, {gender: this.sexList.active.key}),
            avatar: this.newAvatar
        };
        this.isShow.emit(newInfo);
    }
    private selfAvatarChange() {
        this.getImgObj(this.selfAvatarInput.files[0]);
        this.selfAvatarInput.value = '';
    }
    // 获取图片对象
    private getImgObj(file) {
        Util.getAvatarImgObj(file, () => {
            this.selectIsNotImage.emit();
        }, () => {
            this.store$.dispatch({
                type: mainAction.showModalTip,
                payload: {
                    show: true,
                    info: {
                        title: '提示',
                        tip: '选择的图片宽或高的尺寸太小，请重新选择图片',
                        actionType: '[chat] must be image',
                        cancel: true
                    }
                }
            });
        }, (that, pasteFile, img) => {
            this.avatarConfig.info = {
                src: that.result,
                width: img.naturalWidth,
                height: img.naturalHeight,
                pasteFile
            };
            this.avatarConfig.src =  that.result;
            this.avatarConfig.show = true;
            this.avatarConfig.filename = file.name;
        });
    }
    private avatarConfirmEmit(avatarConfig) {
        this.newAvatar.formData = avatarConfig.formData;
        this.selfAvatarImg.src = avatarConfig.src;
        this.newAvatar.url = avatarConfig.src;
        this.cameraShadow = false;
    }
    private toEdit() {
        this.isEdit = true;
        this.selfAvatarImg.src = this.selfInfo.info.avatarUrl;
    }
}

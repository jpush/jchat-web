import { Component, OnInit, Input, Output,
    EventEmitter, AfterViewInit, ViewChild } from '@angular/core';
import { global } from '../../services/common';
import { md5 } from '../../services/tools';

@Component({
    selector: 'modify-password-component',
    templateUrl: './modify-password.component.html',
    styleUrls: ['./modify-password.component.scss']
})

export class ModifyPasswordComponent implements OnInit, AfterViewInit {
    @ViewChild('modifyPasswordInput') private modifyPasswordInput;
    private oldPassword = '';
    private newPassword = '';
    private newPasswordRepeat = '';
    private oldPwdTip = false;
    private repeatPwdTip = 0;
    @Output()
        private modifyPassword: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    public ngAfterViewInit() {
        this.modifyPasswordInput.nativeElement.focus();
    }
    private confirmModify() {
        if (global.password !== md5(this.oldPassword)) {
            this.oldPwdTip = true;
            return ;
        }
        if (this.newPassword !== this.newPasswordRepeat) {
            this.repeatPwdTip = 1;
            return ;
        } else if (this.newPassword.length > 128 || this.newPassword.length < 4) {
            this.repeatPwdTip = 2;
            return ;
        }
        this.modifyPassword.emit({
            old_pwd: this.oldPassword,
            new_pwd: this.newPassword,
            is_md5: false
        });
    }
    private cancelModify() {
        this.oldPassword = '';
        this.newPassword = '';
        this.newPasswordRepeat = '';
        this.oldPwdTip = false;
        this.repeatPwdTip = 0;
        this.modifyPassword.emit();
    }
    private emptyTip(type) {
        if (type === 'oldPassword') {
            this.oldPwdTip = false;
        } else if (type === 'newPassword') {
            this.repeatPwdTip = 0;
        }
    }
}

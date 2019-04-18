import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { AppStore } from '../../../app.store';
import { registerAction } from '../actions';
import { appAction } from '../../../actions';
import { global, ApiService } from '../../../services/common';
import { md5 } from '../../../services/tools';

@Injectable()

export class RegisterEffect {
    private minLength = 4;
    private maxLength = 128;
    private chineseReg = /[\u4e00-\u9fa5]/ig;
    private letterNumberStartReg = /^[0-9a-zA-Z]/ig;
    private charReg = /^([a-zA-Z]|[0-9]|_|\.|-|@){4,}$/ig;
    // 注册
    @Effect()
    private register$: Observable<Action> = this.actions$
        .ofType(registerAction.register)
        .map(toPayload)
        .filter((val) => {
            if (!val.isButtonAvailable) {
                return false;
            }
            if (val.password !== val.repeatPassword) {
                this.store$.dispatch({
                    type: registerAction.repeatPasswordTip,
                    payload: '您两次输入的密码不一致'
                });
                return false;
            } else {
                this.store$.dispatch({
                    type: registerAction.repeatPasswordTip,
                    payload: ''
                });
            }
            if (
                val.username.length > this.maxLength
                || val.username.length < this.minLength
                || val.username.match(this.chineseReg)
                || !val.username.match(this.letterNumberStartReg)
                || val.password.length > this.maxLength
                || val.password.length < this.minLength
                || !val.username.match(this.charReg)
            ) {
                return false;
            }
            return val;
        }).switchMap(async (val) => {
            const registerObj = {
                username: val.username,
                password: md5(val.password),
                is_md5: true
            };
            const data: any = await this.apiService.register(registerObj);
            if (data.code) {
                let usernameTip = '';
                if (data.code === 882002) {
                    usernameTip = '用户名已存在';
                    this.store$.dispatch({
                        type: registerAction.registerFailed,
                        payload: usernameTip
                    });
                } else if (data.code === -2) {
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: data
                    });
                } else {
                    usernameTip = '注册失败';
                    this.store$.dispatch({
                        type: registerAction.registerFailed,
                        payload: usernameTip
                    });
                }
            } else {
                this.store$.dispatch({
                    type: registerAction.registerSuccess,
                    payload: {
                        show: true,
                        info: {
                            title: '提示',
                            tip: '注册成功',
                            actionType: '[main] register success',
                            success: 1
                        }
                    }
                });
            }
            return { type: '[register] register useless' };
        });
    // 用户名是否符合正则
    @Effect()
    private isUsernameAvailable$: Observable<Action> = this.actions$
        .ofType(registerAction.isUsernameAvailableAction)
        .map(toPayload)
        .filter((val) => {
            if (val.username.length === 0) {
                val.usernameTip = '';
                return val;
            }
            let usernameTip = '';
            if (val.username.length > this.maxLength || val.username.length < this.minLength) {
                usernameTip = `用户名为${this.minLength}-${this.maxLength}位字符`;
            } else if (val.username.match(this.chineseReg)) {
                usernameTip = '用户名不支持中文';
            } else if (!val.username.match(this.letterNumberStartReg)) {
                usernameTip = '用户名以字母或数字开头';
            } else if (!val.username.match(this.charReg)) {
                usernameTip = '支持字母、数字、下划线、英文点、减号、@';
            }
            val.usernameTip = usernameTip;
            return val;
        }).switchMap(async (val) => {
            this.store$.dispatch({
                type: registerAction.usernameTip,
                payload: val.usernameTip
            });
            return { type: '[register] is username available useless' };
        });
    // 正则验证密码
    @Effect()
    private password: Observable<Action> = this.actions$
        .ofType(registerAction.password)
        .map(toPayload)
        .filter((val) => {
            let passwordTip = '';
            if (val.password.length > this.maxLength || val.password.length < this.minLength
                && val.password !== '') {
                passwordTip = `密码长度为${this.minLength}-${this.maxLength}字节`;
            }
            this.store$.dispatch({
                type: registerAction.passwordTip,
                payload: passwordTip
            });
            return val;
        }).map((val) => {
            return { type: '[register] password useless' };
        });
    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private apiService: ApiService
    ) { }
}

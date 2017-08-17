import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { AppStore } from '../../../app.store';
import { loginAction } from '../actions';
import { appAction } from '../../../actions';
import { global } from '../../../services/common/global';

@Injectable()

export class LoginEffect {
    // 登录
    @Effect()
    private login$: Observable<Action> = this.actions$
        .ofType(loginAction.login)
        .map(toPayload)
        .switchMap((val) => {
            const that = this;
            const loginObj = global.JIM.login({
                username: val.username,
                password: val.password,
                is_md5: val.md5
            })
            .onSuccess((data) => {
                global.user = data.username;
                that.store$.dispatch({
                    type: loginAction.loginSuccess,
                    payload: val
                });
            }).onFail((error) => {
                that.store$.dispatch({
                    type: loginAction.loginFailed,
                    payload: error
                });
            }).onTimeout((data) => {
                const error = {code: 910000};
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(loginObj)
                    .map((data) => {
                        return {type: '[login] login useless', payload: null};
                    });
        });
    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>
    ) {}
}

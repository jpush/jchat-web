import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { AppStore } from '../../../app.store';
import { loginAction } from '../actions';
import { appAction } from '../../../actions';
import { global, ApiService } from '../../../services/common';

@Injectable()
export class LoginEffect {
    // 登录
    @Effect()
    private login$: Observable<Action> = this.actions$
        .ofType(loginAction.login)
        .map(toPayload)
        .switchMap(async (val) => {
            const loginObj = {
                username: val.username,
                password: val.password,
                is_md5: val.md5
            };
            const data: any = await this.apiService.login(loginObj);
            if (data.code) {
                this.store$.dispatch({
                    type: loginAction.loginFailed,
                    payload: data
                });
            } else {
                global.user = data.username;
                this.store$.dispatch({
                    type: loginAction.loginSuccess,
                    payload: val
                });
            }
            return { type: '[login] login useless' };
        });
    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private apiService: ApiService
    ) { }
}

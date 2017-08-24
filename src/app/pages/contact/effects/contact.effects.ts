import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { appAction } from '../../../actions';

import { global, authPayload } from '../../../services/common';
import { AppStore } from '../../../app.store';
import { contactAction } from '../actions';

@Injectable()

export class ContactEffect {
    // 获取群组列表
    @Effect()
    private getGroupList$: Observable<Action> = this.actions$
        .ofType(contactAction.getGroupList)
        .map(toPayload)
        .switchMap(() => {
            let groupListObj = global.JIM.getGroups()
            .onSuccess((data) => {
                let groupList = data.group_list;
                let flag = false;
                // 解决移动端有些群聊没有用户名的问题
                for (let group of groupList) {
                    if (!group.name || group.name === '') {
                        flag = true;
                        global.JIM.getGroupMembers({gid: group.gid})
                        .onSuccess((member) => {
                            let memberList = member.member_list;
                            let name = '';
                            for (let j = 0; j < memberList.length && j < 5; j++) {
                                name = name + memberList[j].username;
                                let length = memberList.length < 5 ? memberList.length : 5;
                                if (j < length - 1) {
                                    name += '、';
                                }
                            }
                            group.name = name.substr(0, 20);
                            this.store$.dispatch({
                                type: contactAction.getGroupListSuccess,
                                payload: groupList
                            });
                        }).onFail((error) => {
                            this.store$.dispatch({
                                type: appAction.errorApiTip,
                                payload: error
                            });
                            group.name = '#群名获取失败';
                            this.store$.dispatch({
                                type: contactAction.getGroupListSuccess,
                                payload: groupList
                            });
                        });
                    }
                }
                if (!flag) {
                    this.store$.dispatch({
                        type: contactAction.getGroupListSuccess,
                        payload: groupList
                    });
                }
            }).onFail((error) => {
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(groupListObj)
                    .map(() => {
                        return {type: '[main] get group list useless'};
                    });
        });
    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private router: Router
    ) {}
}

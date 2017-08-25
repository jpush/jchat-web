import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { Http } from '@angular/Http';
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
            let that = this;
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
                            that.store$.dispatch({
                                type: contactAction.getGroupListSuccess,
                                payload: groupList
                            });
                        }).onFail((error) => {
                            that.store$.dispatch({
                                type: appAction.errorApiTip,
                                payload: error
                            });
                            group.name = '#群名获取失败？？';
                            that.store$.dispatch({
                                type: contactAction.getGroupListSuccess,
                                payload: groupList
                            });
                        });
                    }
                }
                if (!flag) {
                    that.store$.dispatch({
                        type: contactAction.getGroupListSuccess,
                        payload: groupList
                    });
                }
            }).onFail((error) => {
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(groupListObj)
                    .map(() => {
                        return {type: '[main] get group list useless'};
                    });
        });
    // 获取好友列表
    @Effect()
    private getFriendList$: Observable<Action> = this.actions$
        .ofType(contactAction.getFriendList)
        .map(toPayload)
        .switchMap(() => {
            const that = this;
            const friendListObj = global.JIM.getFriendList()
                .onSuccess((data) => {
                    console.log(3333333, data.friend_list);
                    that.store$.dispatch({
                        type: contactAction.getFriendListSuccess,
                        payload: data.friend_list
                    });
                    for (let friend of data.friend_list) {
                        if (friend.avatar === '') {
                            continue;
                        }
                        global.JIM.getResource({media_id: friend.avatar})
                        .onSuccess((urlInfo) => {
                            friend.avatarUrl = urlInfo.url;
                            that.store$.dispatch({
                                type: contactAction.getFriendListSuccess,
                                payload: data.friend_list
                            });
                        }).onFail((error) => {
                            // pass
                        });
                    }
                }).onFail((error) => {
                    that.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                });
            return Observable.of(friendListObj)
                    .map(() => {
                        return {type: '[main] get friend list useless'};
                    });
        });
    // 同意或拒绝好友请求
    @Effect()
    private isAgreeAddFriend$: Observable<Action> = this.actions$
        .ofType(contactAction.isAgreeAddFriend)
        .map(toPayload)
        .switchMap((message) => {
            let why = '';
            if (message.stateType === 1) {
                why = '拒绝';
            }
            const friendObj = global.JIM.addFriend({
                    target_name: message.name,
                    from_type: 2,
                    why
                }).onSuccess((data) => {
                    if (message.stateType === 1) {
                        this.store$.dispatch({
                            type: contactAction.refuseAddFriendSuccess,
                            payload: message
                        });
                    } else if (message.stateType === 2) {
                        this.store$.dispatch({
                            type: contactAction.agreeAddFriendSuccess,
                            payload: message
                        });
                    }
                }).onFail((error) => {
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                });
            return Observable.of(friendObj)
                    .map(() => {
                        return {type: '[main] is agree add friend useless'};
                    });
        });
    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private router: Router
    ) {}
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { appAction } from '../../../actions';
import { mainAction } from '../../main/actions';
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
            const groupListObj = global.JIM.getGroups()
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
                                name = name + (memberList[j].nickName || memberList[j].username);
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
                            group.name = '#群名获取失败？？';
                            this.store$.dispatch({
                                type: contactAction.getGroupListSuccess,
                                payload: groupList
                            });
                        });
                    }
                    if (group.avatar && group.avatar !== '') {
                        global.JIM.getResource({media_id: group.avatar})
                        .onSuccess((urlInfo) => {
                            group.avatarUrl = urlInfo.url;
                            this.store$.dispatch({
                                type: contactAction.getGroupListSuccess,
                                payload: groupList
                            });
                        }).onFail((error) => {
                            //
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
                        return {type: '[contact] get group list useless'};
                    });
        });
    // 同意或拒绝好友请求
    @Effect()
    private isAgreeAddFriend$: Observable<Action> = this.actions$
        .ofType(contactAction.isAgreeAddFriend)
        .map(toPayload)
        .switchMap((message) => {
            if (message.stateType === 1) {
                global.JIM.declineFriend({
                    target_name: message.name,
                    appkey: message.appkey,
                }).onSuccess((data) => {
                    message.stateType = 3;
                    this.store$.dispatch({
                        type: contactAction.refuseAddFriendSuccess,
                        payload: message
                    });
                }).onFail((error) => {
                    message.stateType = 0;
                    this.store$.dispatch({
                        type: contactAction.addFriendError,
                        payload: message
                    });
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                }).onTimeout(() => {
                    message.stateType = 0;
                    this.store$.dispatch({
                        type: contactAction.addFriendError,
                        payload: message
                    });
                    const error = {code: 910000};
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                });
            } else if (message.stateType === 2) {
                global.JIM.acceptFriend({
                    target_name: message.name,
                    appkey: message.appkey
                }).onSuccess((data) => {
                    message.stateType = 4;
                    this.store$.dispatch({
                        type: contactAction.agreeAddFriendSuccess,
                        payload: message
                    });
                }).onFail((error) => {
                    message.stateType = 0;
                    this.store$.dispatch({
                        type: contactAction.addFriendError,
                        payload: message
                    });
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                }).onTimeout(() => {
                    message.stateType = 0;
                    this.store$.dispatch({
                        type: contactAction.addFriendError,
                        payload: message
                    });
                    const error = {code: 910000};
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                });
            }
            return Observable.of('friendObj')
                    .map(() => {
                        return {type: '[contact] is agree add friend useless'};
                    });
        });
    // 同意或拒绝入群请求
    @Effect()
    private isAgreeEnterGroup$: Observable<Action> = this.actions$
        .ofType(contactAction.isAgreeEnterGroup)
        .map(toPayload)
        .switchMap((verifyGroup) => {
            const verifyGroupObj = global.JIM.addGroupMemberResp({
                gid: verifyGroup.from_gid,
                event_id: verifyGroup.event_id,
                target_appkey: verifyGroup.to_usernames[0].appkey,
                target_username: verifyGroup.to_usernames[0].username,
                result: verifyGroup.stateType === 1 ? 1 : 0,
                from_appkey: verifyGroup.from_appkey,
                from_username: verifyGroup.from_username
             }).onSuccess((data) => {
                verifyGroup.stateType = verifyGroup.stateType === 1 ? 3 : 4;
                this.store$.dispatch({
                    type: contactAction.isAgreeEnterGroupSuccess,
                    payload: verifyGroup
                });
             }).onFail((data) => {
                verifyGroup.stateType = 0;
                this.store$.dispatch({
                    type: contactAction.isAgreeEnterGroupError,
                    payload: verifyGroup
                });
             }).onTimeout(() => {
                verifyGroup.stateType = 0;
                this.store$.dispatch({
                    type: contactAction.isAgreeEnterGroupError,
                    payload: verifyGroup
                });
             });
            return Observable.of(verifyGroupObj)
                    .map(() => {
                        return {type: '[contact] is agree enter group useless'};
                    });
        });
    // 验证消息查看资料
    @Effect()
    private watchVerifyUser$: Observable<Action> = this.actions$
        .ofType(contactAction.watchVerifyUser)
        .map(toPayload)
        .switchMap((info) => {
            const watchVerifyUser = global.JIM.getUserInfo({username: info.name})
            .onSuccess((data) => {
                let infoType = '';
                if (info.stateType === 4 || info.stateType === 5) {
                    infoType = 'watchOtherInfo';
                } else {
                    infoType = 'verifyUser';
                }
                let user = data.user_info;
                let item = {
                    avatar: user.avatar,
                    mtime: user.mtime,
                    name: user.username,
                    nickName: user.nickname,
                    username: user.username,
                    nickname: user.nickname,
                    type: 3,
                    signature: user.signature,
                    gender: user.gender,
                    region: user.region,
                    avatarUrl: '',
                    infoType,
                    eventId: info.eventId,
                    stateType: info.stateType
                };
                if (item.avatar !== '') {
                    global.JIM.getResource({media_id: data.user_info.avatar})
                    .onSuccess((urlInfo) => {
                        item.avatarUrl = urlInfo.url;
                        this.store$.dispatch({
                            type: contactAction.watchVerifyUserSuccess,
                            payload: item
                        });
                    }).onFail((error) => {
                        // pass
                    });
                }
                this.store$.dispatch({
                    type: contactAction.watchVerifyUserSuccess,
                    payload: item
                });
            }).onFail((error) => {
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(watchVerifyUser)
                    .map(() => {
                        return {type: '[contact] watch verify user useless'};
                    });
    });
    // 查看群资料
    @Effect()
    private watchGroupInfo$: Observable<Action> = this.actions$
        .ofType(contactAction.watchGroupInfo)
        .map(toPayload)
        .switchMap((verifyGroup) => {
            let watchGroupInfo = global.JIM.getGroupMembers({
                gid: verifyGroup.from_gid
            }).onSuccess((groupList) => {
                let groupInfo: any = {
                    gid: verifyGroup.from_gid,
                    name: verifyGroup.group_name,
                    desc: verifyGroup.description,
                    avatarUrl: verifyGroup.avatarUrl,
                    avatar: verifyGroup.avatar
                };
                groupInfo.member_list_count = groupList.member_list.length;
                for (let member of groupList.member_list) {
                    if (member.flag === 1) {
                        groupInfo.host = member;
                    }
                    if (member.username === global.user) {
                        groupInfo.isMember = true;
                    }
                }
                this.store$.dispatch({
                    type: mainAction.searchPublicGroupSuccess,
                    payload: {
                        show: true,
                        info: groupInfo
                    }
                });
            }).onFail((error) => {
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((timeout) => {
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(watchGroupInfo)
                    .map(() => {
                        return {type: '[contact] watch group info useless'};
                    });
        });
    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private router: Router
    ) {}
}

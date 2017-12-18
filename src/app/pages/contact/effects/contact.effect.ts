import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { appAction } from '../../../actions';
import { mainAction } from '../../main/actions';
import { global, authPayload, ApiService } from '../../../services/common';
import { AppStore } from '../../../app.store';
import { contactAction } from '../actions';

@Injectable()
export class ContactEffect {
    // 获取群组列表
    @Effect()
    private getGroupList$: Observable<Action> = this.actions$
        .ofType(contactAction.getGroupList)
        .map(toPayload)
        .switchMap(async () => {
            const data: any = await this.apiService.getGroups();
            if (data.code) {
                this.errorFn(data);
            } else {
                let groupList = data.group_list;
                let promises = [];
                // 解决移动端有些群聊没有用户名的问题
                for (let group of groupList) {
                    if (!group.name || group.name === '') {
                        const groupObj = { gid: group.gid };
                        const pro1 = this.concatGroupName(groupObj, group);
                        promises.push(pro1);
                    }
                }
                await Promise.all(promises);
                this.store$.dispatch({
                    type: contactAction.getGroupListSuccess,
                    payload: groupList
                });
                for (let group of groupList) {
                    if (group.avatar && group.avatar !== '') {
                        const urlObj = { media_id: group.avatar };
                        const pro2 = this.apiService.getResource(urlObj).then((urlInfo: any) => {
                            if (!urlInfo.code) {
                                group.avatarUrl = urlInfo.url;
                            }
                        });
                    }
                }
            }
            return { type: '[contact] get group list useless' };
        });
    // 同意或拒绝好友请求
    @Effect()
    private isAgreeAddFriend$: Observable<Action> = this.actions$
        .ofType(contactAction.isAgreeAddFriend)
        .map(toPayload)
        .switchMap(async (message) => {
            if (message.stateType === 1) {
                const friendObj = {
                    target_name: message.name,
                    appkey: message.appkey,
                };
                const data: any = await this.apiService.declineFriend(friendObj);
                if (data.code) {
                    message.stateType = 0;
                    this.store$.dispatch({
                        type: contactAction.addFriendError,
                        payload: message
                    });
                    this.errorFn(data);
                } else {
                    message.stateType = 3;
                    this.store$.dispatch({
                        type: contactAction.refuseAddFriendSuccess,
                        payload: message
                    });
                }
            } else if (message.stateType === 2) {
                const friendObj = {
                    target_name: message.name,
                    appkey: message.appkey
                };
                const data: any = await this.apiService.acceptFriend(friendObj);
                if (data.code) {
                    message.stateType = 0;
                    this.store$.dispatch({
                        type: contactAction.addFriendError,
                        payload: message
                    });
                    this.errorFn(data);
                } else {
                    message.stateType = 4;
                    this.store$.dispatch({
                        type: contactAction.agreeAddFriendSuccess,
                        payload: message
                    });
                }
            }
            return { type: '[contact] is agree add friend useless' };
        });
    // 同意或拒绝入群请求
    @Effect()
    private isAgreeEnterGroup$: Observable<Action> = this.actions$
        .ofType(contactAction.isAgreeEnterGroup)
        .map(toPayload)
        .switchMap(async (verifyGroup) => {
            const memeberObj = {
                gid: verifyGroup.from_gid,
                event_id: verifyGroup.event_id,
                target_appkey: verifyGroup.to_usernames[0].appkey,
                target_username: verifyGroup.to_usernames[0].username,
                result: verifyGroup.stateType === 1 ? 1 : 0,
                from_appkey: verifyGroup.from_appkey,
                from_username: verifyGroup.from_username
            };
            const data: any = await this.apiService.addGroupMemberResp(memeberObj);
            if (data.code) {
                verifyGroup.stateType = 0;
                this.store$.dispatch({
                    type: contactAction.isAgreeEnterGroupError,
                    payload: verifyGroup
                });
            } else {
                verifyGroup.stateType = verifyGroup.stateType === 1 ? 3 : 4;
                this.store$.dispatch({
                    type: contactAction.isAgreeEnterGroupSuccess,
                    payload: verifyGroup
                });
            }
            return { type: '[contact] is agree enter group useless' };
        });
    // 好友验证消息查看用户资料
    @Effect()
    private watchVerifyUser$: Observable<Action> = this.actions$
        .ofType(contactAction.watchVerifyUser)
        .map(toPayload)
        .switchMap(async (info) => {
            const usrObj = { username: info.name };
            const data: any = await this.apiService.getUserInfo(usrObj);
            if (data.code) {
                this.errorFn(data);
            } else {
                let infoType = '';
                if (info.stateType === 4 || info.stateType === 5) {
                    infoType = 'watchOtherInfo';
                } else {
                    infoType = 'verifyFriend';
                }
                const user = data.user_info;
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
                    const urlObj = { media_id: user.avatar };
                    const urlInfo: any = await this.apiService.getResource(urlObj);
                    if (!urlInfo.code) {
                        item.avatarUrl = urlInfo.url;
                    }
                }
                this.store$.dispatch({
                    type: contactAction.watchVerifyUserSuccess,
                    payload: item
                });
            }
            return { type: '[contact] watch verify user useless' };
        });
    // 群组验证消息查看用户资料
    @Effect()
    private watchGroupVerifyUser$: Observable<Action> = this.actions$
        .ofType(contactAction.watchGroupVerifyUser)
        .map(toPayload)
        .switchMap(async (info) => {
            const userObj = { username: info.name };
            const data: any = await this.apiService.getUserInfo(userObj);
            if (data.code) {
                this.errorFn(data);
            } else {
                const user = data.user_info;
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
                    avatarUrl: info.avatarUrl ? info.avatarUrl : '',
                    infoType: info.infoType
                };
                if (item.avatar !== '' && !info.avatarUrl) {
                    const urlObj = { media_id: user.avatar };
                    const urlInfo: any = await this.apiService.getResource(urlObj);
                    if (!urlInfo.code) {
                        item.avatarUrl = urlInfo.url;
                    }
                }
                this.store$.dispatch({
                    type: contactAction.watchVerifyUserSuccess,
                    payload: item
                });
            }
            return { type: '[contact] watch group verify user useless' };
        });
    // 查看群资料
    @Effect()
    private watchGroupInfo$: Observable<Action> = this.actions$
        .ofType(contactAction.watchGroupInfo)
        .map(toPayload)
        .switchMap(async (verifyGroup) => {
            let groupInfo: any = {
                gid: verifyGroup.from_gid,
                name: verifyGroup.group_name,
                avatarUrl: verifyGroup.avatarUrl,
                avatar: verifyGroup.avatar
            };
            const groupObj = {
                gid: verifyGroup.from_gid
            };
            const pro1 = this.apiService.getGroupInfo(groupObj).then((result: any) => {
                if (result.code) {
                    groupInfo.desc = '';
                    this.errorFn(result);
                } else {
                    groupInfo.desc = result.group_info.desc || '';
                }
            });
            const pro2 = this.apiService.getGroupMembers(groupObj).then((result: any) => {
                if (result.code) {
                    this.errorFn(result);
                } else {
                    groupInfo.member_list_count = result.member_list.length;
                    for (let member of result.member_list) {
                        if (member.flag === 1) {
                            groupInfo.host = member;
                        }
                        if (member.username === global.user) {
                            groupInfo.isMember = true;
                        }
                    }
                }
            });
            await Promise.all([pro1, pro2]);
            this.store$.dispatch({
                type: mainAction.searchPublicGroupSuccess,
                payload: {
                    show: true,
                    info: groupInfo
                }
            });
            return { type: '[contact] watch group info useless' };
        });
    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private router: Router,
        private apiService: ApiService
    ) { }
    private errorFn(error) {
        this.store$.dispatch({
            type: appAction.errorApiTip,
            payload: error
        });
    }
    private concatGroupName(groupObj, group) {
        return this.apiService.getGroupMembers(groupObj).then((result: any) => {
            if (result.code) {
                group.name = '#群名获取失败？？';
            } else {
                let memberList = result.member_list;
                let name = '';
                for (let j = 0; j < memberList.length && j < 5; j++) {
                    name = name + (memberList[j].nickName || memberList[j].username);
                    let length = memberList.length < 5 ? memberList.length : 5;
                    if (j < length - 1) {
                        name += '、';
                    }
                }
                group.name = name.substr(0, 20);
            }
        });
    }
}

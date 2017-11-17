import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { AppStore } from '../../../app.store';
import { mainAction } from '../actions';
import { chatAction } from '../../../pages/chat/actions';
import { global, authPayload } from '../../../services/common';
import { md5 } from '../../../services/tools';
import { Util } from '../../../services/util';
import { appAction } from '../../../actions';

@Injectable()
export class MainEffect {
    // 获取个人信息
    @Effect ()
    private getSelfInfo$: Observable<Action> = this.actions$
        .ofType(mainAction.getSelfInfo)
        .map(toPayload)
        .switchMap((info) => {
            const usrInfoObj = global.JIM.getUserInfo({
                username: global.user
            }).onSuccess((data) => {
                if (!data.user_info.avatar || data.user_info.avatar === '') {
                    data.user_info.avatarUrl = '';
                    this.store$.dispatch({
                        type: mainAction.showSelfInfo,
                        payload: {
                            info: data.user_info,
                            show: false,
                            loading: false
                        }
                    });
                    return;
                }
                global.JIM.getResource({media_id: data.user_info.avatar})
                .onSuccess((urlInfo) => {
                    data.user_info.avatarUrl = urlInfo.url;
                    this.store$.dispatch({
                        type: mainAction.showSelfInfo,
                        payload: {
                            info: data.user_info,
                            show: false,
                            loading: false
                        }
                    });
                }).onFail((error) => {
                    data.user_info.avatarUrl = '';
                    this.store$.dispatch({
                        type: mainAction.showSelfInfo,
                        payload: {
                            info: data.user_info,
                            show: false,
                            loading: false
                        }
                    });
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
            return Observable.of(usrInfoObj)
                    .map(() => {
                        return {type: '[main] get selfInfo useless'};
                    });
    });
    // 退出登录
    @Effect()
    private logoutAction$: Observable<Action> = this.actions$
        .ofType(mainAction.logoutAction)
        .map(toPayload)
        .switchMap(() => {
            const loginOutObj = global.JIM.loginOut();
            return Observable.of(loginOutObj)
                    .map(() => {
                        this.router.navigate(['/login']);
                        return {type: '[main] login out useless'};
                    });
        });
    // 更新个人信息
    @Effect()
    private updateSelfInfo$: Observable<Action> = this.actions$
        .ofType(mainAction.updateSelfInfo)
        .map(toPayload)
        .switchMap((self) => {
            const updateSelfInfo = global.JIM.updateSelfInfo(self.info)
                .onSuccess((data) => {
                    if (self.avatar && self.avatar.url) {
                        this.updateSelfAvatar(self);
                    } else {
                        this.store$.dispatch({
                            type: mainAction.showSelfInfo,
                            payload: {
                                info: self.info,
                                loading: false
                            }
                        });
                        this.store$.dispatch({
                            type: mainAction.updateSelfInfoFlag
                        });
                    }
                }).onFail((error) => {
                    if (self.avatar && self.avatar.url) {
                        this.updateSelfAvatar(self);
                    } else {
                        this.store$.dispatch({
                            type: mainAction.showSelfInfo,
                            payload: {
                                loading: false
                            }
                        });
                    }
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                }).onTimeout((data) => {
                    if (self.avatar && self.avatar.url) {
                        this.updateSelfAvatar(self);
                    } else {
                        this.store$.dispatch({
                            type: mainAction.showSelfInfo,
                            payload: {
                                loading: false
                            }
                        });
                    }
                    const error = {code: 910000};
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                });
            return Observable.of(updateSelfInfo)
                    .map(() => {
                        return {type: '[main] update self info useless'};
                    });
        });
    // 创建群聊
    @Effect()
    private createGroup$: Observable<Action> = this.actions$
        .ofType(mainAction.createGroup)
        .map(toPayload)
        .switchMap((groupInfo) => {
            let param: any = {
                group_name: groupInfo.groupName
            };
            if (groupInfo.isLimit) {
                param.is_limit = groupInfo.isLimit;
            }
            if (groupInfo.avatar) {
                param.avatar = groupInfo.avatar;
            }
            const createGroupObj = global.JIM.createGroup(param)
            .onSuccess((data) => {
                this.store$.dispatch({
                    type: mainAction.createGroupNextShow,
                    payload: {
                        show: false,
                        display: false,
                        info: {}
                    }
                });
                this.store$.dispatch({
                    type: mainAction.createGroupShow,
                    payload: {
                        show: false,
                        display: false,
                        info: {}
                    }
                });
                let groupObj = {
                    appkey: authPayload.appKey,
                    desc: data.group_description,
                    gid: data.gid,
                    mtime: data.ctime,
                    name: data.group_name,
                    type: 4,
                    avatarUrl: groupInfo.avatarUrl ? groupInfo.avatarUrl : ''
                };
                // 如果有其他成员
                if (groupInfo.memberUsernames.length > 0) {
                    global.JIM.addGroupMembers({
                        gid: data.gid,
                        member_usernames: groupInfo.memberUsernames
                    }).onSuccess((members) => {
                        this.store$.dispatch({
                            type: mainAction.createGroupSuccess,
                            payload: groupObj
                        });
                    }).onFail((error) => {
                        this.store$.dispatch({
                            type: appAction.errorApiTip,
                            payload: error
                        });
                    });
                } else {
                    this.store$.dispatch({
                        type: mainAction.createGroupSuccess,
                        payload: groupObj
                    });
                }
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
            return Observable.of(createGroupObj)
                    .map(() => {
                        return {type: '[main] create group useless'};
                    });
    });
    // 添加群聊成员
    @Effect()
    private addGroupMember$: Observable<Action> = this.actions$
        .ofType(mainAction.addGroupMember)
        .map(toPayload)
        .switchMap((info) => {
            const addGroupMemberObj = global.JIM.addGroupMembers({
                gid: info.activeGroup.key,
                member_usernames: info.memberUsernames
            }).onSuccess((data) => {
                this.store$.dispatch({
                    type: mainAction.addGroupMemberSuccess,
                    payload: info.detailMember
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
            return Observable.of(addGroupMemberObj)
                    .map(() => {
                        return {type: '[main] add group members useless'};
                    });
    });
    // 修改密码
    @Effect()
    private modifyPassword$: Observable<Action> = this.actions$
        .ofType(mainAction.modifyPassword)
        .map(toPayload)
        .switchMap((passwordInfo) => {
            const passwordInfoObj = global.JIM.updateSelfPwd({
                old_pwd: md5(passwordInfo.old_pwd),
                new_pwd: md5(passwordInfo.new_pwd),
                is_md5: true
            })
            .onSuccess((data) => {
                global.JIM.loginOut();
                this.store$.dispatch({
                    type: mainAction.modifyPasswordShow,
                    payload: {
                        repeatLogin: md5(passwordInfo.new_pwd),
                        show: false
                    }
                });
                this.store$.dispatch({
                    type: mainAction.showModalTip,
                    payload: {
                        show: true,
                        info: {
                            title: '提示',
                            tip: '密码修改成功',
                            actionType: '[main] modify password alert',
                            success: 1// 1 代表成功 2代表失败
                        }
                    }
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
            return Observable.of(passwordInfoObj)
                    .map(() => {
                        return {type: '[main] modify password useless'};
                    });
    });
    // 创建单聊/添加好友
    @Effect()
    private createSingleChatAction$: Observable<Action> = this.actions$
        .ofType(mainAction.createSingleChatAction)
        .map(toPayload)
        .switchMap((info) => {
            const createSingleChatObj = global.JIM.getUserInfo({username: info.singleName})
            .onSuccess((data) => {
                let user = data.user_info;
                let item = {
                    avatar: user.avatar,
                    // key: user.key || user.uid,
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
                    infoType: info.type
                };
                if (item.avatar !== '') {
                    global.JIM.getResource({media_id: data.user_info.avatar})
                    .onSuccess((urlInfo) => {
                        item.avatarUrl = urlInfo.url;
                        this.store$.dispatch({
                            type: mainAction.createSingleChatSuccess,
                            payload: item
                        });
                    }).onFail((error) => {
                        // pass
                    });
                }
                this.store$.dispatch({
                    type: mainAction.createSingleChatSuccess,
                    payload: item
                });
            }).onFail((error) => {
                if (error.code === 882002) {
                    this.store$.dispatch({
                        type: mainAction.createSingleChatShow,
                        payload: {
                            show: true,
                            info: '用户不存在'
                        }
                    });
                } else {
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                }
            }).onTimeout((data) => {
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(createSingleChatObj)
                    .map(() => {
                        return {type: '[main] create single chat action useless'};
                    });
    });
    // 创建群聊搜索联系人或者转发消息搜索联系人
    @Effect()
    private createGroupSearchAction$: Observable<Action> = this.actions$
        .ofType(mainAction.createGroupSearchAction)
        .map(toPayload)
        .switchMap((info) => {
            const createGroupSearchObj = global.JIM.getUserInfo({
                username: info.keywords
            }).onSuccess((data) => {
                let user = data.user_info;
                let item = {
                    avatar: '',
                    avatarUrl: '',
                    mtime: user.mtime,
                    name: user.username,
                    username: user.username,
                    nickName: user.nickname,
                    type: 3,
                    appkey: user.appkey
                };
                if (user.avatar !== '') {
                    global.JIM.getResource({media_id: user.avatar})
                    .onSuccess((urlInfo) => {
                        item.avatarUrl = urlInfo.url;
                        this.searUserType(info, item, info.keywords);
                    }).onFail((error) => {
                        this.searUserType(info, item, info.keywords);
                    }).onTimeout(() => {
                        this.searUserType(info, item, info.keywords);
                    });
                } else {
                    this.searUserType(info, item, info.keywords);
                }
            }).onFail((error) => {
                if (error.code === 882002) {
                    this.searUserType(info, null, info.keywords);
                } else {
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                }
            }).onTimeout((data) => {
                this.searUserType(info, null, info.keywords);
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(createGroupSearchObj)
                    .map(() => {
                        return {type: '[main] create group search action useless'};
                    });
    });
    // 获取黑名单列表
    @Effect()
    private blackMenuShow$: Observable<Action> = this.actions$
        .ofType(mainAction.blackMenu)
        .map(toPayload)
        .switchMap((isShow) => {
            const blackMenuObj = global.JIM.getBlacks()
            .onSuccess((data) => {
                if (data.black_list.length === 0) {
                    this.store$.dispatch({
                        type: mainAction.blackMenuSuccess,
                        payload: {
                            show: isShow.show,
                            menu: data.black_list
                        }
                    });
                    return ;
                }
                for (let black of data.black_list) {
                    global.JIM.getResource({media_id: black.avatar})
                    .onSuccess((urlInfo) => {
                        black.avatarUrl = urlInfo.url;
                        this.store$.dispatch({
                            type: mainAction.blackMenuSuccess,
                            payload: {
                                show: isShow.show,
                                menu: data.black_list
                            }
                        });
                    }).onFail((error) => {
                        this.store$.dispatch({
                            type: mainAction.blackMenuSuccess,
                            payload: {
                                show: isShow.show,
                                menu: data.black_list
                            }
                        });
                    });
                }
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
            return Observable.of(blackMenuObj)
                    .map(() => {
                        return {type: '[main] black menu show useless'};
                    });
    });
    // 移出黑名单列表
    @Effect()
    private delSingleBlack$: Observable<Action> = this.actions$
        .ofType(mainAction.delSingleBlack)
        .map(toPayload)
        .switchMap((user) => {
            const delSingleBlackObj = global.JIM.delSingleBlacks({
                member_usernames: [{
                    username: user.username,
                    appkey: authPayload.appKey
                }]
            }).onSuccess((data) => {
                this.store$.dispatch({
                    type: mainAction.delSingleBlackSuccess,
                    payload: user
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
            return Observable.of(delSingleBlackObj)
                    .map(() => {
                        return {type: '[main] delete single black useless'};
                    });
    });
    // 加入黑名单
    @Effect()
    private addBlackListAction$: Observable<Action> = this.actions$
        .ofType(mainAction.addBlackListAction)
        .map(toPayload)
        .switchMap((active) => {
            const addBlackListObj = global.JIM.addSingleBlacks({
                member_usernames: [{
                    username: active.name || active.username,
                    appkey: authPayload.appKey
                }]
            }).onSuccess((data) => {
                this.store$.dispatch({
                    type: mainAction.showModalTip,
                    payload: {
                        show: true,
                        info: {
                            title: '加入黑名单',
                            tip: '加入黑名单成功',
                            actionType: '[main] add single black useless',
                            success: 1
                        }
                    }
                });
                this.store$.dispatch({
                    type: mainAction.addBlackListSuccess,
                    payload: {
                        show: false,
                        info: {
                            title: '',
                            tip: ''
                        },
                        deleteItem: {
                            item: active
                        }
                    }
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
            return Observable.of(addBlackListObj)
                    .map(() => {
                        return {type: '[main] add black list useless'};
                    });
    });
    // 退出群聊
    @Effect()
    private exitGroupAction$: Observable<Action> = this.actions$
        .ofType(mainAction.exitGroupAction)
        .map(toPayload)
        .filter((data) => {
            if (!data) {
                return false;
            }else {
                return data;
            }
        })
        .switchMap((gid) => {
            const exitGroupObj = global.JIM.exitGroup({gid})
            .onSuccess((data) => {
                this.store$.dispatch({
                    type: mainAction.exitGroupSuccess,
                    payload: {
                        tipModal: {
                            show: false,
                            info: {
                                title: '',
                                tip: ''
                            }
                        },
                        item: {
                            key: gid
                        }
                    }
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
            return Observable.of(exitGroupObj)
                    .map(() => {
                        return {type: '[main] exit group useless'};
                    });
    });
    // 删除群聊成员
    @Effect()
    private deleteMemberAction$: Observable<Action> = this.actions$
        .ofType(mainAction.deleteMemberAction)
        .map(toPayload)
        .switchMap((info) => {
            const deleteMember = global.JIM.delGroupMembers({
                gid: info.group.key,
                member_usernames: [
                    {username: info.deleteItem.username}
                ]
            }).onSuccess((data) => {
                this.store$.dispatch({
                    type: mainAction.deleteMemberSuccess,
                    payload: {
                        tipModal: {
                            show: false,
                            info: {
                                title: '',
                                tip: ''
                            }
                        },
                        deleteItem: info.deleteItem,
                        group: info.group
                    }
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
            return Observable.of(deleteMember)
                    .map(() => {
                        return {type: '[main] delete group member useless'};
                    });
    });
    // 被踢后重新登录
    @Effect()
    private login$: Observable<Action> = this.actions$
        .ofType(mainAction.login)
        .map(toPayload)
        .switchMap((val) => {
            const timestamp = new Date().getTime();
            const signature = Util.createSignature(timestamp);
            const loginObj = global.JIM.init({
                appkey: authPayload.appKey,
                random_str: authPayload.randomStr,
                signature: authPayload.signature || signature,
                timestamp: authPayload.timestamp || timestamp,
                flag: authPayload.flag
            }).onSuccess((data) => {
                global.JIM.login({
                    username: val.username,
                    password: val.password,
                    is_md5: val.md5
                })
                .onSuccess((login) => {
                    if (val.reload) {
                        window.location.reload();
                    }
                }).onFail((error) => {
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
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
            return Observable.of(loginObj)
                    .map(() => {
                        return {type: '[main] login useless'};
                    });
    });
    // 用户资料中删除免打扰
    @Effect()
    private addSingleNoDisturbAction$: Observable<Action> = this.actions$
        .ofType(mainAction.addSingleNoDisturbAction)
        .map(toPayload)
        .switchMap((user) => {
            const loginObj = global.JIM.addSingleNoDisturb({
                    target_name: user.name
                }).onSuccess((data) => {
                    this.store$.dispatch({
                        type: mainAction.showModalTip,
                        payload: {
                            show: true,
                            info: {
                                title: '添加消息免打扰',
                                tip: '添加消息免打扰成功',
                                actionType: '[main] add single no disturb action useless',
                                success: 1
                            }
                        }
                    });
                    this.store$.dispatch({
                        type: mainAction.addSingleNoDisturbSuccess,
                        payload: user
                    });
                }).onFail((error) => {
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                    this.store$.dispatch({
                        type: mainAction.hideModalTip,
                        payload: {
                            show: false,
                            info: {}
                        }
                    });
                }).onTimeout((data) => {
                    const error = {code: 910000};
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                    this.store$.dispatch({
                        type: mainAction.hideModalTip,
                        payload: {
                            show: false,
                            info: {}
                        }
                    });
                });
            return Observable.of(loginObj)
                    .map(() => {
                        return {type: '[main] add single no disturb action useless'};
                    });
    });
    // 删除好友
    @Effect()
    private deleteFriend$: Observable<Action> = this.actions$
        .ofType(mainAction.deleteFriend)
        .map(toPayload)
        .switchMap((user) => {
            const deleteFriend = global.JIM.delFriend({
                    target_name: user.name
                }).onSuccess((data) => {
                    this.store$.dispatch({
                        type: mainAction.showModalTip,
                        payload: {
                            show: true,
                            info: {
                                title: '删除好友',
                                tip: '删除好友成功',
                                actionType: '[main] delete friend success useless',
                                success: 1
                            }
                        }
                    });
                    this.store$.dispatch({
                        type: mainAction.deleteFriendSuccess,
                        payload: user
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
            return Observable.of(deleteFriend)
                    .map(() => {
                        return {type: '[main] delete friend useless'};
                    });
    });
    // 搜索聊天室
    @Effect()
    private searchUser$: Observable<Action> = this.actions$
        .ofType(mainAction.searchUser)
        .map(toPayload)
        .switchMap((payload) => {
            if (!Number.isNaN(Number(payload))) {
                const searchUser = global.JIM.getChatroomInfo({
                    id: payload
                }).onSuccess((data) => {
                    this.store$.dispatch({
                        type: mainAction.searchUserSuccess,
                        payload: {
                            room: data.info,
                            keywords: payload
                        }
                    });
                }).onFail((error) => {
                    this.store$.dispatch({
                        type: mainAction.searchUserSuccess,
                        payload: {
                            room: null,
                            keywords: payload
                        }
                    });
                }).onTimeout((data) => {
                    this.store$.dispatch({
                        type: mainAction.searchUserSuccess,
                        payload: {
                            room: null,
                            keywords: payload
                        }
                    });
                });
            } else {
                this.store$.dispatch({
                    type: mainAction.searchUserSuccess,
                    payload: {
                        room: null,
                        keywords: payload
                    }
                });
            }
            return Observable.of('searchUser')
                    .map(() => {
                        return {type: '[main] search user useless'};
                    });
        });
    // 搜索群组资料
    @Effect()
    private searchPublicGroup$: Observable<Action> = this.actions$
        .ofType(mainAction.searchPublicGroup)
        .map(toPayload)
        .switchMap((gid) => {
            if (Number.isNaN(Number(gid))) {
                this.store$.dispatch({
                    type: mainAction.enterPublicGroupShow,
                    payload: {
                        show: true,
                        info: {
                            text: '群组ID是数字，请输入正确的格式'
                        }
                    }
                });
                return Observable.of('searchPublicGroupObj')
                        .map(() => {
                            return {type: '[main] search public group useless'};
                        });
            }
            const searchPublicGroupObj = global.JIM.getGroupInfo({
                gid
            }).onSuccess((data) => {
                if (data.group_info.flag === 2) {
                    let count = 0;
                    if (data.group_info.avatar && data.group_info.avatar !== '') {
                        count ++;
                        global.JIM.getResource({media_id: data.group_info.avatar})
                        .onSuccess((urlInfo) => {
                            data.group_info.avatarUrl = urlInfo.url;
                            if (-- count <= 0) {
                                this.store$.dispatch({
                                    type: mainAction.searchPublicGroupSuccess,
                                    payload: {
                                        show: true,
                                        info: data.group_info
                                    }
                                });
                            }
                        }).onFail((error) => {
                            if (-- count <= 0) {
                                this.store$.dispatch({
                                    type: mainAction.searchPublicGroupSuccess,
                                    payload: {
                                        show: true,
                                        info: data.group_info
                                    }
                                });
                            }
                        }).onTimeout(() => {
                            if (-- count <= 0) {
                                this.store$.dispatch({
                                    type: mainAction.searchPublicGroupSuccess,
                                    payload: {
                                        show: true,
                                        info: data.group_info
                                    }
                                });
                            }
                        });
                    }
                    count ++;
                    global.JIM.getGroupMembers({
                        gid
                    }).onSuccess((groupList) => {
                        data.group_info.member_list_count = groupList.member_list.length;
                        for (let member of groupList.member_list) {
                            if (member.flag === 1) {
                                data.group_info.host = member;
                            }
                            if (member.username === global.user) {
                                data.group_info.isMember = true;
                            }
                        }
                        if (-- count <= 0) {
                            this.store$.dispatch({
                                type: mainAction.searchPublicGroupSuccess,
                                payload: {
                                    show: true,
                                    info: data.group_info
                                }
                            });
                        }
                    }).onFail((info) => {
                        this.store$.dispatch({
                            type: mainAction.enterPublicGroupShow,
                            payload: {
                                show: true,
                                info: {
                                    text: '查找公开群失败'
                                }
                            }
                        });
                    }).onTimeout((timeout) => {
                        const error = {code: 910000};
                        this.store$.dispatch({
                            type: appAction.errorApiTip,
                            payload: error
                        });
                    });
                } else {
                    this.store$.dispatch({
                        type: mainAction.enterPublicGroupShow,
                        payload: {
                            show: true,
                            info: {
                                text: '未搜索到公开群'
                            }
                        }
                    });
                }
            }).onFail((error) => {
                if (error.code === 882002) {
                    this.store$.dispatch({
                        type: mainAction.enterPublicGroupShow,
                        payload: {
                            show: true,
                            info: {
                                text: '未搜索到公开群'
                            }
                        }
                    });
                } else {
                    this.store$.dispatch({
                        type: mainAction.enterPublicGroupShow,
                        payload: {
                            show: true,
                            info: {
                                text: '查找公开群失败'
                            }
                        }
                    });
                }
            }).onTimeout((data) => {
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(searchPublicGroupObj)
                    .map(() => {
                        return {type: '[main] search public group useless'};
                    });
    });
    // 发送申请入群
    @Effect()
    private sendGroupVerifyMessage$: Observable<Action> = this.actions$
        .ofType(mainAction.sendGroupVerifyMessage)
        .map(toPayload)
        .switchMap((payload) => {
            const sendGroupVerifyMessageObj = global.JIM.joinGroup({
                gid: payload.info.gid,
                reason: payload.text
            }).onSuccess((data) => {
                this.store$.dispatch({
                    type: mainAction.showModalTip,
                    payload: {
                        show: true,
                        info: {
                            title: '发送成功',
                            tip: '入群申请已发送，请等待审核',
                            actionType: '[main] send verify group success',
                            success: 1
                        }
                    }
                });
                this.store$.dispatch({
                    type: mainAction.groupVerifyModal,
                    payload: {
                        show: false
                    }
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
            return Observable.of(sendGroupVerifyMessageObj)
                    .map(() => {
                        return {type: '[main] send group verify message useless'};
                    });
    });
    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private router: Router
    ) {}
    private searUserType (info, item, keywords) {
        if (info.type === 'createGroup') {
            this.store$.dispatch({
                type: chatAction.createGroupSearchComplete,
                payload: {
                    result: item,
                    keywords
                }
            });
        }
    }
    // 更新个人头像
    private updateSelfAvatar(self) {
        global.JIM.updateSelfAvatar({avatar: self.avatar.formData})
        .onSuccess((data) => {
            this.store$.dispatch({
                type: mainAction.showSelfInfo,
                payload: {
                    avatar: self.avatar,
                    info: self.info,
                    loading: false
                }
            });
            this.store$.dispatch({
                type: mainAction.updateSelfInfoFlag
            });
        }).onFail((error) => {
            this.store$.dispatch({
                type: mainAction.showSelfInfo,
                payload: {
                    loading: false
                }
            });
            this.store$.dispatch({
                type: appAction.errorApiTip,
                payload: error
            });
        }).onTimeout((data) => {
            this.store$.dispatch({
                type: mainAction.showSelfInfo,
                payload: {
                    loading: false
                }
            });
            const error = {code: 910000};
            this.store$.dispatch({
                type: appAction.errorApiTip,
                payload: error
            });
        });
    }
}

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/debounceTime';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { Http } from '@angular/Http';
import { ActivatedRoute, Router } from '@angular/router';
import { appAction } from '../../../actions';
import { global, authPayload, StorageService } from '../../../services/common';
import { AppStore } from '../../../app.store';
import { chatAction } from '../actions';
import { Util } from '../../../services/util';

@Injectable()

export class ChatEffect {
    private util: Util = new Util();
    // 接收到新消息
    @Effect()
    private receiveMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.receiveMessage)
        .map(toPayload)
        .switchMap((obj) => {
            const that = this;
            let count = 0;
            let increase = 0;
            let messages = obj.data.messages;
            // messages只有一个元素
            for (let i = 0; i < messages.length; i++) {
                global.JIM.getUserInfo({
                    username: messages[i].content.from_id
                }).onSuccess((user) => {
                    if (!user.user_info.avatar || user.user_info.avatar === '') {
                        count ++;
                        if (count === messages.length + increase) {
                            that.store$.dispatch({
                                type: chatAction.receiveMessageSuccess,
                                payload: obj.data
                            });
                        }
                        return;
                    }
                    global.JIM.getResource({media_id: user.user_info.avatar})
                    .onSuccess((urlInfo) => {
                        obj.data.messages[i].content.avatarUrl = urlInfo.url;
                        count ++;
                        if (count === messages.length + increase) {
                            that.store$.dispatch({
                                type: chatAction.receiveMessageSuccess,
                                payload: obj.data
                            });
                        }
                    }).onFail((error) => {
                        count ++;
                        if (count === messages.length + increase) {
                            that.store$.dispatch({
                                type: chatAction.receiveMessageSuccess,
                                payload: obj.data
                            });
                        }
                    });
                }).onFail((error) => {
                    count ++;
                    if (count === messages.length + increase) {
                        that.store$.dispatch({
                            type: chatAction.receiveMessageSuccess,
                            payload: obj.data
                        });
                    }
                });
                // 如果消息所在的群聊不在消息列表中，且群名为空，需要获取群的成员，将群成员的昵称或用户名拼接
                let result = obj.conversation.filter((item) => {
                    return obj.data.messages[i].msg_type === 4 &&
                            Number(obj.data.messages[i].from_gid) === Number(item.key);
                });
                if (result.length === 0 && obj.data.messages[i].msg_type === 4
                     && !obj.data.messages[i].content.target_name) {
                    increase ++;
                    global.JIM.getGroupMembers({gid: obj.data.messages[i].content.target_id})
                    .onSuccess((data) => {
                        count ++;
                        let name = '';
                        for (let list of data.member_list) {
                            name += ((list.nickName !== '' ? list.nickName : list.username) + '、');
                        }
                        if (name.length > 20) {
                            obj.data.messages[i].content.target_name = name.substr(0, 20);
                        } else {
                            obj.data.messages[i].content.target_name =
                                name.substr(0, name.length - 1);
                        }
                        if (count === messages.length + increase) {
                            that.store$.dispatch({
                                type: chatAction.receiveMessageSuccess,
                                payload: obj.data
                            });
                        }
                    }).onFail((error) => {
                        count ++;
                        obj.data.messages[i].content.target_name = '群名获取失败？？';
                        if (count === messages.length + increase) {
                            that.store$.dispatch({
                                type: chatAction.receiveMessageSuccess,
                                payload: obj.data
                            });
                        }
                        that.store$.dispatch({
                            type: appAction.errorApiTip,
                            payload: error
                        });
                    });
                }
            }
            return Observable.of('receiveMessage')
                    .map(() => {
                        return {type: '[chat] receive message useless'};
                    });
        });
    // 获取storage里的voice状态
    @Effect()
    private getVoiceState$: Observable<Action> = this.actions$
        .ofType(chatAction.getVoiceState)
        .map(toPayload)
        .switchMap((key) => {
            let voiceState = this.storageService.get(key);
            if (voiceState) {
                this.store$.dispatch({
                    type: chatAction.getVoiceStateSuccess,
                    payload: JSON.parse(voiceState)
                });
            }
            return Observable.of('getVoiceState')
                    .map(() => {
                        return {type: '[chat] get voice state useless'};
                    });
        });
    // 获取messageList 图片消息url
    @Effect()
    private getSourceUrl$: Observable<Action> = this.actions$
        .ofType(chatAction.getSourceUrl)
        .map(toPayload)
        .switchMap((info) => {
            const that = this;
            let resourceArray = [];
            let msgs = info.messageList[info.active.activeIndex].msgs;
            for (let msg of msgs) {
                let msgBody = msg.content.msg_body;
                if (msgBody.media_id && !msgBody.media_url) {
                    global.JIM.getResource({media_id: msgBody.media_id})
                    .onSuccess((urlInfo) => {
                        msg.content.msg_body.media_url = urlInfo.url;
                        that.store$.dispatch({
                            type: chatAction.getAllMessageSuccess,
                            payload: info.messageList
                        });
                    }).onFail((error) => {
                        msg.content.msg_body.media_url = '';
                        that.store$.dispatch({
                            type: chatAction.getAllMessageSuccess,
                            payload: info.messageList
                        });
                    });
                }
            }
            return Observable.of('getSourceUrl')
                    .map(() => {
                        return {type: '[chat] get source url useless'};
                    });
        });
    // 获取messageList avatar url
    @Effect()
    private getMemberAvatarUrl$: Observable<Action> = this.actions$
        .ofType(chatAction.getMemberAvatarUrl)
        .map(toPayload)
        .switchMap((info) => {
            const that = this;
            let msgs = info.messageList[info.active.activeIndex].msgs;
            for (let msg of msgs) {
                global.JIM.getUserInfo({
                    username: msg.content.from_id
                }).onSuccess((data) => {
                    if (data.user_info.avatar === '') {
                        msg.content.avatarUrl = '';
                        that.store$.dispatch({
                            type: chatAction.getAllMessageSuccess,
                            payload: info.messageList
                        });
                    } else {
                        global.JIM.getResource({media_id: data.user_info.avatar})
                        .onSuccess((urlInfo) => {
                            msg.content.avatarUrl = urlInfo.url;
                            that.store$.dispatch({
                                type: chatAction.getAllMessageSuccess,
                                payload: info.messageList
                            });
                        }).onFail((error) => {
                            that.store$.dispatch({
                                type: chatAction.getAllMessageSuccess,
                                payload: info.messageList
                            });
                        });
                    }
                }).onFail((error) => {
                    that.store$.dispatch({
                        type: chatAction.getAllMessageSuccess,
                        payload: info.messageList
                    });
                });
            }
            return Observable.of('getMemberAvatarUrl')
                    .map(() => {
                        return {type: '[chat] get member avatar url useless'};
                    });
        });
    // 获取所有漫游同步消息及资源路径
    @Effect()
    private getAllMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.getAllMessage)
        .map(toPayload)
        .switchMap((data) => {
            const that = this;
            for (let dataItem of data) {
                for (let j = 0; j < dataItem.msgs.length; j++) {
                    if (j + 1 < dataItem.msgs.length || dataItem.msgs.length === 1) {
                        if (j === 0) {
                            dataItem.msgs[j].time_show =
                                this.util.reducerDate(dataItem.msgs[j].ctime_ms);
                        }
                        if (j + 1 !== dataItem.msgs.length) {
                            let timeGap =
                            (dataItem.msgs[j + 1].ctime_ms - dataItem.msgs[j].ctime_ms) / 1000 / 60;
                            if (timeGap > 5) {
                                dataItem.msgs[j + 1].time_show =
                                    this.util.reducerDate(dataItem.msgs[j + 1].ctime_ms);
                            }
                        }
                    }
                    // 给文件消息添加下载按钮hover提示需要的数据
                    if (dataItem.msgs[j].content.msg_type === 'file') {
                        dataItem.msgs[j].downloadHover = {
                            tip: '下载文件',
                            position: {
                                left: -20,
                                top: 27
                            },
                            show: false
                        };
                    }
                }
            }
            let conversationObj = global.JIM.getConversation()
            .onSuccess((info) => {
                info.conversations = info.conversations.reverse();
                // 获取头像url
                let count = 0;
                for (let conversation of info.conversations) {
                    if (conversation.avatar && conversation.avatar !== ''
                        && conversation.type === 3) {
                        count ++;
                        global.JIM.getResource({media_id: conversation.avatar})
                        .onSuccess((urlInfo) => {
                            conversation.avatarUrl = urlInfo.url;
                            count --;
                            that.dispatchConversation (count, that, info, data);
                        }).onFail((error) => {
                            count --;
                            that.dispatchConversation (count, that, info, data);
                        });
                    }
                    if (conversation.type === 4 && conversation.name === '') {
                        count ++;
                        global.JIM.getGroupMembers({gid: conversation.key})
                        .onSuccess((member) => {
                            count --;
                            let name = '';
                            for (let list of member.member_list) {
                                name += (list.nickName !== '' ? list.nickName : list.username)
                                        + '、';
                            }
                            if (name.length > 20) {
                                conversation.name = name.substr(0, 20);
                            } else {
                                conversation.name = name.substr(0, name.length - 1);
                            }
                            that.dispatchConversation (count, that, info, data);
                        }).onFail((error) => {
                            count --;
                            conversation.name = '群名获取失败？？';
                            that.store$.dispatch({
                                type: appAction.errorApiTip,
                                payload: error
                            });
                            that.dispatchConversation (count, that, info, data);
                        });
                    }
                }
                that.dispatchConversation (count, that, info, data);
                // 获取屏蔽列表
                global.JIM.groupShieldList()
                .onSuccess((groupList) => {
                    that.store$.dispatch({
                        type: chatAction.getConversationSuccess,
                        payload: {
                            shield: groupList.groups
                        }
                    });
                }).onFail((error) => {
                    that.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                });
            }).onFail((error) => {
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(conversationObj)
                    .map(() => {
                        return {type: '[chat] get all messageList useless'};
                    });
    });
    // 发送单人消息
    @Effect()
    private sendMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.sendSingleMessage)
        .map(toPayload)
        .filter((data) => {
            if (!data.singleMsg.content) {
                return false;
            }
            return data;
        })
        .switchMap((text) => {
            const that = this;
            let msgObj = global.JIM.sendSingleMsg(text.singleMsg)
            .onSuccess((data, msgs) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.key,
                        success: 2,
                        msgId: msgs.msg_id
                    }
                });
            }).onFail((error) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.key,
                        success: 3
                    }
                });
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.key,
                        success: 3
                    }
                });
                const error = {code: 910000};
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(msgObj)
                    .map(() => {
                        return {type: '[chat] send single message useless'};
                    });
        });
    // 发送群组消息
    @Effect()
    private sendGroupMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.sendGroupMessage)
        .map(toPayload)
        .filter((data) => {
            if (!data.groupMsg.content) {
                return false;
            }
            return data;
        })
        .switchMap((text) => {
            const that = this;
            let groupMessageObj = global.JIM.sendGroupMsg(text.groupMsg)
            .onSuccess((data, msgs) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.key,
                        success: 2,
                        msgId: msgs.msg_id
                    }
                });
            }).onFail((error) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.key,
                        success: 3
                    }
                });
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.key,
                        success: 3
                    }
                });
                const error = {code: 910000};
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(groupMessageObj)
                    .map(() => {
                        return {type: '[chat] send group message useless'};
                    });
        });
    // 发送单聊图片
    @Effect()
    private sendSinglePic$: Observable<Action> = this.actions$
        .ofType(chatAction.sendSinglePic)
        .map(toPayload)
        .switchMap((img) => {
            const that = this;
            let singlePicObj = global.JIM.sendSinglePic(img.singlePicFormData)
            .onSuccess((info, msgs) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 2,
                        msgId: msgs.msg_id
                    }
                });
            }).onFail((error) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 3
                    }
                });
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 3
                    }
                });
                const error = {code: 910000};
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(singlePicObj)
                    .map(() => {
                        return {type: '[chat] send single picture useless'};
                    });
        });
    // 发送群组图片
    @Effect()
    private sendGroupPic$: Observable<Action> = this.actions$
        .ofType(chatAction.sendGroupPic)
        .map(toPayload)
        .switchMap((img) => {
            const that = this;
            let sendGroupPicObj = global.JIM.sendGroupPic(img.groupPicFormData)
            .onSuccess((info, msgs) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 2,
                        msgId: msgs.msg_id
                    }
                });
            }).onFail((error, msgs) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 3
                    }
                });
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 3
                    }
                });
                const error = {code: 910000};
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(sendGroupPicObj)
                    .map(() => {
                        return {type: '[chat] send group pic useless'};
                    });
        });
    // 发送单聊文件
    @Effect()
    private sendSingleFile$: Observable<Action> = this.actions$
        .ofType(chatAction.sendSingleFile)
        .map(toPayload)
        .switchMap((file) => {
            const that = this;
            let sendSingleFileObj = global.JIM.sendSingleFile(file.singleFile)
            .onSuccess((data, msgs) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 2,
                        msgId: msgs.msg_id
                    }
                });
            }).onFail((error) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 3
                    }
                });
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 3
                    }
                });
                const error = {code: 910000};
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(sendSingleFileObj)
                    .map(() => {
                        return {type: '[chat] send single file useless'};
                    });
        });
    // 发送群组文件
    @Effect()
    private sendGroupFile$: Observable<Action> = this.actions$
        .ofType(chatAction.sendGroupFile)
        .map(toPayload)
        .switchMap((file) => {
            const that = this;
            let sendgroupFileObj = global.JIM.sendGroupFile(file.groupFile)
            .onSuccess((data, msgs) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 2,
                        msgId: msgs.msg_id
                    }
                });
            }).onFail((error) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 3
                    }
                });
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                that.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 3
                    }
                });
                const error = {code: 910000};
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(sendgroupFileObj)
                    .map(() => {
                        return {type: '[chat] send group file useless'};
                    });
        });
    // 查看别人的资料
    @Effect()
    private watchOtherInfo$: Observable<Action> = this.actions$
        .ofType(chatAction.watchOtherInfo)
        .map(toPayload)
        .switchMap((other) => {
            const that = this;
            let OtherInfoObj = global.JIM.getUserInfo({
                username: other.username
            }).onSuccess((data) => {
                global.JIM.getBlacks()
                .onSuccess((black) => {
                    that.store$.dispatch({
                        type: chatAction.watchOtherInfoSuccess,
                        payload: {
                            info: data.user_info,
                            show: true,
                            black: black.black_list
                        }
                    });
                }).onFail((error) => {
                    that.store$.dispatch({
                        type: chatAction.watchOtherInfoSuccess,
                        payload: {
                            info: data.user_info,
                            show: true,
                            black: []
                        }
                    });
                    that.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                });
                if (other.hasOwnProperty('avatarUrl') || data.user_info.avatar === '') {
                    data.user_info.avatarUrl = other.avatarUrl ? other.avatarUrl : '';
                    that.store$.dispatch({
                        type: chatAction.watchOtherInfoSuccess,
                        payload: {
                            info: data.user_info,
                            show: true
                        }
                    });
                } else {
                    global.JIM.getResource({media_id: data.user_info.avatar})
                    .onSuccess((urlInfo) => {
                        data.user_info.avatarUrl = urlInfo.url;
                        that.store$.dispatch({
                            type: chatAction.watchOtherInfoSuccess,
                            payload: {
                                info: data.user_info,
                                show: true
                            }
                        });
                    }).onFail((error) => {
                        that.store$.dispatch({
                            type: chatAction.watchOtherInfoSuccess,
                            payload: {
                                info: data.user_info,
                                show: true
                            }
                        });
                    });
                }
            }).onFail((error) => {
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                const error = {code: 910000};
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(OtherInfoObj)
                    .map(() => {
                        return {type: '[chat] watch other info useless'};
                    });
    });
    // 获取群组信息和群成员信息
    @Effect()
    private groupInfo$: Observable<Action> = this.actions$
        .ofType(chatAction.groupSetting)
        .map(toPayload)
        .filter((data) => {
            if (data.show === false || data.active.type === 3 || data.isCache) {
                return false;
            }
            return data;
        })
        .switchMap((info) => {
            const that = this;
            let groupInfoObj = global.JIM.getGroupInfo({gid: info.active.key})
            .onSuccess((data) => {
                that.store$.dispatch({
                    type: chatAction.groupInfo,
                    payload: {
                        groupInfo: data.group_info
                    }
                });
            }).onFail((error) => {
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                const error = {code: 910000};
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            let groupMemberObj = global.JIM.getGroupMembers({gid: info.active.key})
            .onSuccess((data) => {
                that.store$.dispatch({
                    type: chatAction.groupInfo,
                    payload: {
                        memberList: data.member_list
                    }
                });
                for (let member of data.member_list) {
                    if (member.avatar) {
                        global.JIM.getResource({media_id: member.avatar})
                        .onSuccess((urlInfo) => {
                            member.avatarUrl = urlInfo.url;
                            that.store$.dispatch({
                                type: chatAction.groupInfo,
                                payload: {
                                    memberList: data.member_list
                                }
                            });
                        }).onFail((error) => {
                            //
                        });
                    }
                }
            }).onFail((error) => {
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                const error = {code: 910000};
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(groupInfoObj)
                    .map(() => {
                        return {type: '[chat] group info useless'};
                    });
    });
    // 更新群组资料
    @Effect()
    private updateGroupInfo$: Observable<Action> = this.actions$
        .ofType(chatAction.updateGroupInfo)
        .map(toPayload)
        .switchMap((info) => {
            const that = this;
            let groupInfoObj = global.JIM.updateGroupInfo( {
                group_name: info.name,
                group_description: info.desc,
                gid: info.gid
            }).onSuccess((data) => {
                if (info.actionType && info.actionType === 'modifyName') {
                    that.store$.dispatch({
                        type: chatAction.groupName,
                        payload: info
                    });
                } else {
                    that.store$.dispatch({
                        type: chatAction.groupDescription,
                        payload: {
                            data,
                            show: false
                        }
                    });
                }
            }).onFail((error) => {
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                const error = {code: 910000};
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(groupInfoObj)
                    .map(() => {
                        return {type: '[chat] update group info useless'};
                    });
    });
    // 切换群屏蔽
    @Effect()
    private changeGroupShield$: Observable<Action> = this.actions$
        .ofType(chatAction.changeGroupShield)
        .map(toPayload)
        .switchMap((active) => {
            const that = this;
            if (active.shield === 'switchRight') {
                global.JIM.delGroupShield({gid: active.key})
                .onSuccess((data) => {
                    active.shield = 'switchLeft';
                    that.store$.dispatch({
                        type: chatAction.changeGroupShieldSuccess,
                        payload: active
                    });
                }).onFail((error) => {
                    that.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                }).onTimeout((data) => {
                    const error = {code: 910000};
                    that.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                });
            } else {
                global.JIM.addGroupShield({gid: active.key})
                .onSuccess((data) => {
                    active.shield = 'switchRight';
                    that.store$.dispatch({
                        type: chatAction.changeGroupShieldSuccess,
                        payload: active
                    });
                }).onFail((error) => {
                    that.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                }).onTimeout((data) => {
                    const error = {code: 910000};
                    that.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                });
            }
            return Observable.of('changeNoDisturbObj')
                    .map(() => {
                        return {type: '[chat] change no disturb useless'};
                    });
    });
    // 被添加进群时获取群信息
    @Effect()
    private addGroupMembersEvent$: Observable<Action> = this.actions$
        .ofType(chatAction.addGroupMembersEvent)
        .map(toPayload)
        .switchMap((eventData) => {
            if (global.user === eventData.from_username) {
                this.store$.dispatch({
                    type: chatAction.addGroupMembersEventSuccess,
                    payload: eventData
                });
                return Observable.of('addGroupMembersEventObj')
                    .map(() => {
                        return {type: '[chat] add group members event useless'};
                    });
            }
            const that = this;
            let groupInfoObj = global.JIM.getGroupInfo({gid: eventData.gid})
            .onSuccess((obj) => {
                if (obj.group_info.name && obj.group_info.name !== '') {
                    eventData.name = obj.group_info.name;
                    that.store$.dispatch({
                        type: chatAction.addGroupMembersEventSuccess,
                        payload: eventData
                    });
                    let count = 0;
                    for (let userList of eventData.to_usernames) {
                        global.JIM.getUserInfo({
                            username: userList.username
                        }).onSuccess((user) => {
                            userList.key = user.uid;
                            if (user.user_info.avatar === '') {
                                count ++;
                                if (count === eventData.to_usernames.length) {
                                    that.store$.dispatch({
                                        type: chatAction.updateGroupMembersEvent,
                                        payload: {
                                            eventData
                                        }
                                    });
                                }
                            } else {
                                global.JIM.getResource({media_id: user.user_info.avatar})
                                .onSuccess((urlInfo) => {
                                    userList.avatarUrl = urlInfo.url;
                                    count ++;
                                    if (count === eventData.to_usernames.length) {
                                        that.store$.dispatch({
                                            type: chatAction.updateGroupMembersEvent,
                                            payload: {
                                                eventData
                                            }
                                        });
                                    }
                                }).onFail((error) => {
                                    count ++;
                                    if (count === eventData.to_usernames.length) {
                                        that.store$.dispatch({
                                            type: chatAction.updateGroupMembersEvent,
                                            payload: {
                                                eventData
                                            }
                                        });
                                    }
                                });
                            }
                        }).onFail((error) => {
                            count ++;
                            if (count === eventData.to_usernames.length) {
                                that.store$.dispatch({
                                    type: chatAction.updateGroupMembersEvent,
                                    payload: {
                                        eventData
                                    }
                                });
                            }
                        });
                    }
                } else {
                    global.JIM.getGroupMembers({gid: eventData.gid})
                    .onSuccess((data) => {
                        let name = '';
                        let count = 0;
                        for (let member of data.member_list) {
                            name += (member.nickName !== '' ?
                                member.nickName : member.username) + '、';
                            for (let userList of eventData.to_usernames) {
                                if (userList.username === member.username) {
                                    global.JIM.getResource({media_id: member.avatar})
                                    .onSuccess((urlInfo) => {
                                        userList.avatarUrl = urlInfo.url;
                                        count ++;
                                        if (count === eventData.to_usernames.length) {
                                            that.store$.dispatch({
                                                type: chatAction.updateGroupMembersEvent,
                                                payload: {
                                                    eventData
                                                }
                                            });
                                        }
                                    }).onFail((error) => {
                                        count ++;
                                        if (count === eventData.to_usernames.length) {
                                            that.store$.dispatch({
                                                type: chatAction.updateGroupMembersEvent,
                                                payload: {
                                                    eventData
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        }
                        if (name.length > 20) {
                            eventData.name = name.substr(0, 20);
                        } else {
                            eventData.name = name.substr(0, name.length - 1);
                        }
                        that.store$.dispatch({
                            type: chatAction.addGroupMembersEventSuccess,
                            payload: eventData
                        });
                    }).onFail((error) => {
                        that.store$.dispatch({
                            type: appAction.errorApiTip,
                            payload: error
                        });
                        eventData.name = '群名获取失败？？';
                        that.store$.dispatch({
                            type: chatAction.addGroupMembersEventSuccess,
                            payload: eventData
                        });
                    });
                }
            }).onFail((error) => {
                that.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of('addGroupMembersEventObj')
                    .map(() => {
                        return {type: '[chat] add group members event useless'};
                    });
    });
    // 创建群组事件
    @Effect()
    private createGroupEvent$: Observable<Action> = this.actions$
        .ofType(chatAction.createGroupEvent)
        .map(toPayload)
        .switchMap((eventData) => {
            const that = this;
            let groupInfoObj = global.JIM.getGroupInfo({gid: eventData.gid})
            .onSuccess((obj) => {
                eventData.name = obj.group_info.name;
                that.store$.dispatch({
                    type: chatAction.createGroupSuccessEvent,
                    payload: eventData
                });
            })
            .onFail((error) => {
                eventData.name = '群名获取失败？？';
                that.store$.dispatch({
                    type: chatAction.createGroupSuccessEvent,
                    payload: eventData
                });
            });
            return Observable.of('createGroupEvent')
                    .map(() => {
                        return {type: '[chat] create group event useless'};
                    });
    });
    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private router: Router,
        private storageService: StorageService
    ) {}
    private dispatchConversation (count, that, info, data) {
        if (count <= 0) {
            let msgId =
                JSON.parse(that.storageService.get('msgId' + global.user));
            that.store$.dispatch({
                type: chatAction.getConversationSuccess,
                payload: {
                    conversation: info.conversations,
                    msgId,
                    storage: true,
                    messageList: data
                }
            });
        }
    }
}

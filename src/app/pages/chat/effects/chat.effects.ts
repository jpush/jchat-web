import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/debounceTime';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { appAction } from '../../../actions';
import { global, authPayload, StorageService, pageNumber } from '../../../services/common';
import { AppStore } from '../../../app.store';
import { chatAction } from '../actions';
import { mainAction } from '../../main/actions';
import { Util } from '../../../services/util';

@Injectable()

export class ChatEffect {
    private util: Util = new Util();
    // 同步自己发送的消息
    @Effect()
    private syncReceiveMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.syncReceiveMessage)
        .map(toPayload)
        .switchMap((info) => {
            let count = 0;
            if (info.data.messages[0].content.msg_body.media_id) {
                count ++;
                this.requestMediaUrl(info.data, count);
            }
            if (info.data.messages[0]) {
                count ++;
                this.requestMsgAvatarUrl(info.data.messages[0], info, count);
            }
            if (count <= 0) {
                this.store$.dispatch({
                    type: chatAction.receiveMessageSuccess,
                    payload: info.data
                });
            }
            return Observable.of('syncReceiveMessage')
                    .map(() => {
                        return {type: '[chat] receive single message useless'};
                    });
        });
    // 接收到单聊新消息
    @Effect()
    private receiveSingleMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.receiveSingleMessage)
        .map(toPayload)
        .switchMap((info) => {
            let count = 0;
            const content = info.data.messages[0].content;
            if (info.data.messages[0].content.msg_body.media_id) {
                count ++;
                this.requestMediaUrl(info.data, count);
            }
            let result = info.conversation.filter((conversation) => {
                return info.data.messages[0].content.from_id === conversation.name;
            });
            if (result.length === 0) {
                count ++;
                this.requestMsgAvatarUrl(info.data.messages[0], info, count);
                // 给已有的单聊用户添加头像
            } else {
                content.avatarUrl = result[0].avatarUrl;
            }
            // 如果接收的是名片
            if (content.msg_type === 'text' && content.msg_body.extras &&
                content.msg_body.extras.businessCard) {
                count ++;
                this.requestCardInfo(info.data, count);
            }
            if (count <= 0) {
                this.store$.dispatch({
                    type: chatAction.receiveMessageSuccess,
                    payload: info.data
                });
            }
            return Observable.of('receiveSingleMessage')
                    .map(() => {
                        return {type: '[chat] receive single message useless'};
                    });
        });
    // 接收到群聊新消息
    @Effect()
    private receiveGroupMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.receiveGroupMessage)
        .map(toPayload)
        .switchMap((obj) => {
            let count = 0;
            let messages = obj.data.messages[0];
            let messageList = obj.messageList;
            let flag = false;
            let content = obj.data.messages[0].content;
            if (messages.content.msg_body.media_id) {
                count ++;
                this.requestMediaUrl(obj.data, count);
            }
            // 如果接收的是名片
            if (content.msg_type === 'text' && content.msg_body.extras &&
                content.msg_body.extras.businessCard) {
                count ++;
                this.requestCardInfo(obj.data, count);
            }
            // 判断是否消息列表中已经加载过头像
            for (let list of messageList) {
                if (list.type === 4 && Number(list.key) === Number(messages.key)
                    && list.msgs.length > 0) {
                    for (let i = list.msgs.length - 1; i >= 0; i--) {
                        let hasLoadAvatar = list.msgs[i].content.hasOwnProperty('avatarUrl');
                        if (list.msgs[i].content.from_id === messages.content.from_id
                            && hasLoadAvatar) {
                            messages.content.avatarUrl = list.msgs[i].content.avatarUrl;
                            if (count <= 0) {
                                this.store$.dispatch({
                                    type: chatAction.receiveMessageSuccess,
                                    payload: obj.data
                                });
                            }
                            flag = true;
                            break;
                        }
                    }
                    break;
                }
            }
            if (!flag) {
                count ++;
                // 消息列表中没有加载过头像
                this.requestMsgAvatarUrl(messages, obj, count);
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
    // 获取好友列表
    @Effect()
    private getFriendList$: Observable<Action> = this.actions$
        .ofType(chatAction.getFriendList)
        .map(toPayload)
        .switchMap((info) => {
            const friendListObj = global.JIM.getFriendList()
                .onSuccess((data) => {
                    let payload;
                    if (info === 'api') {
                        payload = {
                            friendList: data.friend_list,
                            type: info
                        };
                    } else {
                        payload = data.friend_list;
                    }
                    this.store$.dispatch({
                        type: chatAction.getFriendListSuccess,
                        payload
                    });
                    for (let friend of data.friend_list) {
                        if (friend.avatar === '') {
                            continue;
                        }
                        global.JIM.getResource({media_id: friend.avatar})
                        .onSuccess((urlInfo) => {
                            friend.avatarUrl = urlInfo.url;
                            this.store$.dispatch({
                                type: chatAction.getFriendListSuccess,
                                payload: data.friend_list
                            });
                        }).onFail((error) => {
                            // pass
                        });
                    }
                }).onFail((error) => {
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                });
            return Observable.of(friendListObj)
                    .map(() => {
                        return {type: '[chat] get friend list useless'};
                    });
        });
    // 获取messageList 图片消息url
    @Effect()
    private getSourceUrl$: Observable<Action> = this.actions$
        .ofType(chatAction.getSourceUrl)
        .map(toPayload)
        .switchMap((info) => {
            let resourceArray = [];
            let msgs = info.messageList[info.active.activeIndex].msgs;
            let end = msgs.length - (info.loadingCount - 1) * pageNumber;
            // 滚动加载资源路径
            if (end >= 1) {
                for (let i = end - 1; i >= end - pageNumber && i >= 0; i--) {
                    if (msgs[i].hasLoad) {
                        continue;
                    }
                    msgs[i].hasLoad = true;
                    let msgBody = msgs[i].content.msg_body;
                    if (msgBody.media_id && !msgBody.media_url) {
                        global.JIM.getResource({media_id: msgBody.media_id})
                        .onSuccess((urlInfo) => {
                            msgs[i].content.msg_body.media_url = urlInfo.url;
                            this.store$.dispatch({
                                type: chatAction.getAllMessageSuccess,
                                payload: info.messageList
                            });
                        }).onFail((error) => {
                            msgs[i].content.msg_body.media_url = '';
                            this.store$.dispatch({
                                type: chatAction.getAllMessageSuccess,
                                payload: info.messageList
                            });
                        });
                    } else if (msgBody.extras && msgBody.extras.businessCard) {
                        global.JIM.getUserInfo({
                            username:  msgBody.extras.userName
                        }).onSuccess((data) => {
                            msgBody.extras.nickName = data.user_info.nickname;
                            if (data.user_info.avatar === '') {
                                msgBody.extras.media_url = '';
                                this.store$.dispatch({
                                    type: chatAction.getAllMessageSuccess,
                                    payload: info.messageList
                                });
                            } else {
                                global.JIM.getResource({media_id: data.user_info.avatar})
                                .onSuccess((urlInfo) => {
                                    msgBody.extras.media_url = urlInfo.url;
                                    this.store$.dispatch({
                                        type: chatAction.getAllMessageSuccess,
                                        payload: info.messageList
                                    });
                                }).onFail((error) => {
                                    this.store$.dispatch({
                                        type: chatAction.getAllMessageSuccess,
                                        payload: info.messageList
                                    });
                                });
                            }
                        }).onFail((error) => {
                            this.store$.dispatch({
                                type: chatAction.getAllMessageSuccess,
                                payload: info.messageList
                            });
                        });
                    }
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
            let msgs = info.messageList[info.active.activeIndex].msgs;
            let end = msgs.length - (info.loadingCount - 1) * pageNumber;
            for (let i = end - 1; i >= end - pageNumber && i >= 0 && end >= 1; i--) {
                // 如果是已经加载过头像的用户
                if (info.loadingCount !== 1) {
                    let flag = false;
                    for (let j = end; j < msgs.length; j++) {
                        if (msgs[i].content.from_id === msgs[j].content.from_id) {
                            msgs[i].content.avatarUrl = msgs[j].content.avatarUrl;
                            flag = true;
                            this.store$.dispatch({
                                type: chatAction.getAllMessageSuccess,
                                payload: info.messageList
                            });
                            break;
                        }
                    }
                    if (flag) {
                        continue;
                    }
                }
                // 第一次加载头像的用户
                global.JIM.getUserInfo({
                    username: msgs[i].content.from_id
                }).onSuccess((data) => {
                    if (data.user_info.avatar === '') {
                        msgs[i].content.avatarUrl = '';
                        this.store$.dispatch({
                            type: chatAction.getAllMessageSuccess,
                            payload: info.messageList
                        });
                    } else {
                        global.JIM.getResource({media_id: data.user_info.avatar})
                        .onSuccess((urlInfo) => {
                            msgs[i].content.avatarUrl = urlInfo.url;
                            this.store$.dispatch({
                                type: chatAction.getAllMessageSuccess,
                                payload: info.messageList
                            });
                        }).onFail((error) => {
                            this.store$.dispatch({
                                type: chatAction.getAllMessageSuccess,
                                payload: info.messageList
                            });
                        });
                    }
                }).onFail((error) => {
                    this.store$.dispatch({
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
                }
                for (let receiptMsg of dataItem.receipt_msgs) {
                    for (let message of dataItem.msgs) {
                        if (receiptMsg.msg_id === message.msg_id) {
                            message.unread_count = receiptMsg.unread_count;
                            break;
                        }
                    }
                }
                if (dataItem.msgs.length > 0) {
                    if (dataItem.msgs[0].msg_type === 3) {
                        dataItem.type = 3;
                        if (dataItem.msgs[0].content.from_id === global.user) {
                            dataItem.name = dataItem.msgs[0].content.target_id;
                            dataItem.appkey = dataItem.msgs[0].content.target_appkey;
                        } else if (dataItem.msgs[0].content.target_id === global.user) {
                            dataItem.name = dataItem.msgs[0].content.from_id;
                            dataItem.appkey = dataItem.msgs[0].content.from_appkey;
                        }
                    } else if (dataItem.msgs[0].msg_type === 4) {
                        dataItem.type = 4;
                    }
                }
            }
            const conversationObj = global.JIM.getConversation()
            .onSuccess((info) => {
                // 删除feedBack_
                for (let i = 0; i < info.conversations.length; i++) {
                    info.conversations[i].unreadNum = info.conversations[i].unread_msg_count;
                    if (info.conversations[i].name.match(/^feedback_/g)) {
                        info.conversations.splice(i, 1);
                    }
                }
                info.conversations.reverse();
                // 对置顶会话进行排序
                let topArr = [];
                let notopArr = [];
                for (let conversation of info.conversations) {
                    if (conversation.extras && conversation.extras.top_time_ms) {
                        topArr.push(conversation);
                    } else {
                        notopArr.push(conversation);
                    }
                }
                for (let i = 0; i < topArr.length; i++) {
                    for (let j = i + 1; j < topArr.length; j++) {
                        if (topArr[i].extras.top_time_ms > topArr[j].extras.top_time_ms) {
                            let temp = topArr[i];
                            topArr[i] = topArr[j];
                            topArr[j] = temp;
                        }
                    }
                }
                info.conversations = topArr.concat(notopArr);
                // 获取头像url
                let count = 0;
                for (let conversation of info.conversations) {
                    if (conversation.avatar && conversation.avatar !== '') {
                        count ++;
                        global.JIM.getResource({media_id: conversation.avatar})
                        .onSuccess((urlInfo) => {
                            conversation.avatarUrl = urlInfo.url;
                            count --;
                            this.dispatchConversation(count, info, data);
                        }).onFail((error) => {
                            count --;
                            this.dispatchConversation(count, info, data);
                        });
                    }
                    if (conversation.type === 4 && conversation.name === '') {
                        count ++;
                        this.requestGroupName(conversation, (error) => {
                            count --;
                            conversation.name = '群名获取失败？？';
                            this.store$.dispatch({
                                type: appAction.errorApiTip,
                                payload: error
                            });
                            this.dispatchConversation(count, info, data);
                        }, () => {
                            count --;
                            this.dispatchConversation(count, info, data);
                        });
                    }
                }
                this.dispatchConversation(count, info, data);
                // 获取屏蔽列表
                global.JIM.groupShieldList()
                .onSuccess((groupList) => {
                    this.store$.dispatch({
                        type: chatAction.getConversationSuccess,
                        payload: {
                            shield: groupList.groups
                        }
                    });
                }).onFail((error) => {
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                });
                global.JIM.getNoDisturb()
                .onSuccess((noDisturbList) => {
                   this.store$.dispatch({
                        type: chatAction.getConversationSuccess,
                        payload: {
                            noDisturb: noDisturbList.no_disturb
                        }
                    });
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
            const msgObj = global.JIM.sendSingleMsg(text.singleMsg)
            .onSuccess((data, msgs) => {
                msgs.key = data.key;
                msgs.unread_count = 1;
                msgs.msg_type = 3;
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.key,
                        success: 2,
                        msgs,
                        name: text.active.name,
                        type: 3
                    }
                });
            }).onFail((error) => {
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.key,
                        success: 3,
                        name: text.active.name,
                        type: 3
                    }
                });
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.key,
                        success: 3,
                        name: text.active.name,
                        type: 3
                    }
                });
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(msgObj)
                    .map(() => {
                        return {type: '[chat] send single message useless'};
                    });
        });
    // 转发单人消息
    @Effect()
    private transmitMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitSingleMessage)
        .map(toPayload)
        .switchMap((text) => {
            const msgBody = {
                text: text.msgs.content.msg_body.text,
                extras: text.msgs.content.msg_body.extras
            };
            const msgObj = global.JIM.sendSingleMsg({
                target_username: text.select.name,
                target_nickname: text.select.nickName,
                msg_body: msgBody,
                need_receipt: true
            })
            .onSuccess((data, msgs) => {
                msgs.key = data.key;
                msgs.unread_count = 1;
                msgs.msg_type = 3;
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.select.key,
                        success: 2,
                        msgs,
                        name: text.select.name,
                        type: 3
                    }
                });
            }).onFail((error) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.select.key,
                        success: 3,
                        name: text.select.name,
                        type: 3
                    }
                });
                error.text = text.select.memo_name || text.select.nickName || text.select.name;
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.select.key,
                        success: 3,
                        name: text.select.name,
                        type: 3
                    }
                });
                const error = {
                    code: 910000,
                    text: text.select.name
                };
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(msgObj)
                    .map(() => {
                        return {type: '[chat] transmit single message useless'};
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
            const groupMessageObj = global.JIM.sendGroupMsg(text.groupMsg)
            .onSuccess((data, msgs) => {
                msgs.key = data.key;
                msgs.unread_count = data.unread_count;
                msgs.msg_type = 4;
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.key,
                        success: 2,
                        msgs,
                        type: 4
                    }
                });
            }).onFail((error) => {
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.key,
                        success: 3,
                        type: 4
                    }
                });
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.key,
                        success: 3,
                        type: 4
                    }
                });
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(groupMessageObj)
                    .map(() => {
                        return {type: '[chat] send group message useless'};
                    });
        });
    // 转发群组消息
    @Effect()
    private transmitGroupMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitGroupMessage)
        .map(toPayload)
        .switchMap((text) => {
            const msgBody = {
                text: text.msgs.content.msg_body.text,
                extras: text.msgs.content.msg_body.extras
            };
            const groupMessageObj = global.JIM.sendGroupMsg({
                target_gid: text.select.key,
                target_gname: text.select.name,
                msg_body: msgBody,
                need_receipt: true
            }).onSuccess((data, msgs) => {
                msgs.key = data.key;
                msgs.unread_count = data.unread_count;
                msgs.msg_type = 4;
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.select.key,
                        success: 2,
                        msgs,
                        type: 4
                    }
                });
            }).onFail((error) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.select.key,
                        success: 3,
                        type: 4
                    }
                });
                error.text = text.select.memo_name || text.select.nickName || text.select.name;
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.select.key,
                        success: 3,
                        type: 4
                    }
                });
                const error = {
                    code: 910000,
                    text: text.select.name
                };
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(groupMessageObj)
                    .map(() => {
                        return {type: '[chat] transmit group message useless'};
                    });
        });
    // 发送单聊图片
    @Effect()
    private sendSinglePic$: Observable<Action> = this.actions$
        .ofType(chatAction.sendSinglePic)
        .map(toPayload)
        .switchMap((img) => {
            const singlePicObj = global.JIM.sendSinglePic(img.singlePicFormData)
            .onSuccess((data, msgs) => {
                msgs.key = data.key;
                msgs.unread_count = 1;
                msgs.msg_type = 3;
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 2,
                        msgs,
                        name: img.active.name,
                        type: 3
                    }
                });
            }).onFail((error) => {
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 3,
                        name: img.active.name,
                        type: 3
                    }
                });
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 3,
                        name: img.active.name,
                        type: 3
                    }
                });
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(singlePicObj)
                    .map(() => {
                        return {type: '[chat] send single picture useless'};
                    });
        });
    // 转发单聊图片
    @Effect()
    private transmitSinglePic$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitSinglePic)
        .map(toPayload)
        .switchMap((img) => {
            const body = img.msgs.content.msg_body;
            const msgBody = {
                media_id: body.media_id,
                media_crc32: body.media_crc32,
                width: body.width,
                height: body.height,
                format: body.format,
                fsize: body.fsize,
                extras : body.extras
            };
            const singlePicObj = global.JIM.sendSinglePic({
                target_username: img.select.name,
                msg_body: msgBody,
                need_receipt: true
            })
            .onSuccess((data, msgs) => {
                msgs.key = data.key;
                msgs.unread_count = 1;
                msgs.msg_type = 3;
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 2,
                        msgs,
                        name: img.select.name,
                        type: 3
                    }
                });
            }).onFail((error) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 3,
                        name: img.select.name,
                        type: 3
                    }
                });
                if (!img.sendType) {
                    error.text = img.select.memo_name || img.select.nickName || img.select.name;
                }
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 3,
                        name: img.select.name,
                        type: 3
                    }
                });
                const error: any = {
                    code: 910000
                };
                if (!img.sendType) {
                    error.text = img.select.memo_name || img.select.nickName || img.select.name;
                }
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(singlePicObj)
                    .map(() => {
                        return {type: '[chat] transmit single picture useless'};
                    });
        });
    // 发送群组图片
    @Effect()
    private sendGroupPic$: Observable<Action> = this.actions$
        .ofType(chatAction.sendGroupPic)
        .map(toPayload)
        .switchMap((img) => {
            const sendGroupPicObj = global.JIM.sendGroupPic(img.groupPicFormData)
            .onSuccess((data, msgs) => {
                msgs.key = data.key;
                msgs.unread_count = data.unread_count;
                msgs.msg_type = 4;
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 2,
                        msgs,
                        type: 4
                    }
                });
            }).onFail((error, msgs) => {
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 3,
                        type: 4
                    }
                });
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 3,
                        type: 4
                    }
                });
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(sendGroupPicObj)
                    .map(() => {
                        return {type: '[chat] send group pic useless'};
                    });
        });
    // 转发群组图片
    @Effect()
    private transmitGroupPic$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitGroupPic)
        .map(toPayload)
        .switchMap((img) => {
            const body = img.msgs.content.msg_body;
            const msgBody = {
                media_id: body.media_id,
                media_crc32: body.media_crc32,
                width: body.width,
                height: body.height,
                format: body.format,
                fsize: body.fsize,
                extras : body.extras
            };
            const sendGroupPicObj = global.JIM.sendGroupPic({
                target_gid: img.select.key,
                msg_body: msgBody,
                need_receipt: true
            }).onSuccess((data, msgs) => {
                msgs.key = data.key;
                msgs.unread_count = data.unread_count;
                msgs.msg_type = 4;
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 2,
                        msgs,
                        type: 4
                    }
                });
            }).onFail((error, msgs) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 3,
                        type: 4
                    }
                });
                error.text = img.select.memo_name || img.select.nickName || img.select.name;
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 3,
                        type: 4
                    }
                });
                const error = {
                    code: 910000,
                    text: img.select.name
                };
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(sendGroupPicObj)
                    .map(() => {
                        return {type: '[chat] transmit group pic useless'};
                    });
        });
    // 发送单聊文件
    @Effect()
    private sendSingleFile$: Observable<Action> = this.actions$
        .ofType(chatAction.sendSingleFile)
        .map(toPayload)
        .switchMap((file) => {
            let sendSingleFileObj = global.JIM.sendSingleFile(file.singleFile)
            .onSuccess((data, msgs) => {
                msgs.key = data.key;
                msgs.unread_count = 1;
                msgs.msg_type = 3;
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 2,
                        msgs,
                        type: 3,
                        name: file.active.name
                    }
                });
            }).onFail((error) => {
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 3,
                        type: 3,
                        name: file.active.name
                    }
                });
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 3,
                        type: 3,
                        name: file.active.name
                    }
                });
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(sendSingleFileObj)
                    .map(() => {
                        return {type: '[chat] send single file useless'};
                    });
        });
    // 转发单聊文件
    @Effect()
    private transmitSingleFile$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitSingleFile)
        .map(toPayload)
        .switchMap((file) => {
            const body = file.msgs.content.msg_body;
            const msgBody = {
                media_id: body.media_id,
                media_crc32: body.media_crc32,
                hash: body.hash,
                fname: body.fname,
                fsize: body.fsize,
                extras : body.extras
            };
            let sendSingleFileObj = global.JIM.sendSingleFile({
                target_username: file.select.name,
                msg_body: msgBody,
                need_receipt: true
            })
            .onSuccess((data, msgs) => {
                msgs.key = data.key;
                msgs.unread_count = 1;
                msgs.msg_type = 3;
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 2,
                        msgs,
                        name: file.select.name,
                        type: 3
                    }
                });
            }).onFail((error) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 3,
                        name: file.select.name,
                        type: 3
                    }
                });
                error.text = file.select.memo_name || file.select.nickName || file.select.name;
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 3,
                        name: file.select.name,
                        type: 3
                    }
                });
                const error = {
                    code: 910000,
                    text: file.select.name
                };
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(sendSingleFileObj)
                    .map(() => {
                        return {type: '[chat] transmit single file useless'};
                    });
        });
    // 发送群组文件
    @Effect()
    private sendGroupFile$: Observable<Action> = this.actions$
        .ofType(chatAction.sendGroupFile)
        .map(toPayload)
        .switchMap((file) => {
            const sendgroupFileObj = global.JIM.sendGroupFile(file.groupFile)
            .onSuccess((data, msgs) => {
                msgs.key = data.key;
                msgs.unread_count = data.unread_count;
                msgs.msg_type = 4;
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 2,
                        msgs,
                        type: 4
                    }
                });
            }).onFail((error) => {
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 3,
                        type: 4
                    }
                });
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 3,
                        type: 4
                    }
                });
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(sendgroupFileObj)
                    .map(() => {
                        return {type: '[chat] send group file useless'};
                    });
        });
    // 转发群组文件
    @Effect()
    private transmitGroupFile$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitGroupFile)
        .map(toPayload)
        .switchMap((file) => {
            const body = file.msgs.content.msg_body;
            const msgBody = {
                media_id: body.media_id,
                media_crc32: body.media_crc32,
                hash: body.hash,
                fname: body.fname,
                fsize: body.fsize,
                extras : body.extras
            };
            const sendgroupFileObj = global.JIM.sendGroupFile({
                target_gid: file.select.key,
                msg_body: msgBody,
                need_receipt: true
            })
            .onSuccess((data, msgs) => {
                msgs.key = data.key;
                msgs.unread_count = data.unread_count;
                msgs.msg_type = 4;
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 2,
                        msgs,
                        type: 4
                    }
                });
            }).onFail((error) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 3,
                        type: 4
                    }
                });
                error.text = file.select.memo_name || file.select.nickName || file.select.name;
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 3,
                        type: 4
                    }
                });
                const error = {
                    code: 910000,
                    text: file.select.name
                };
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(sendgroupFileObj)
                    .map(() => {
                        return {type: '[chat] transmit group file useless'};
                    });
        });
    // 转发单聊位置
    @Effect()
    private transmitSingleLocation$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitSingleLocation)
        .map(toPayload)
        .switchMap((location) => {
            const body = location.msgs.content.msg_body;
            const msgBody = {
                latitude: body.latitude,
                longitude: body.longitude,
                scale: body.scale,
                label: body.label,
                fsize: body.fsize,
                extras : body.extras
            };
            const sendSingleLocation = global.JIM.sendSingleLocation({
                target_username: location.select.name,
                msg_body: msgBody,
                need_receipt: true
            })
            .onSuccess((data, msgs) => {
                msgs.key = data.key;
                msgs.unread_count = 1;
                msgs.msg_type = 3;
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: location.msgs.msgKey,
                        key: location.key,
                        success: 2,
                        msgs,
                        name: location.select.name,
                        type: 3
                    }
                });
            }).onFail((error) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: location.msgs.msgKey,
                        key: location.key,
                        success: 3,
                        name: location.select.name,
                        type: 3
                    }
                });
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: location.msgs.msgKey,
                        key: location.key,
                        success: 3,
                        name: location.select.name,
                        type: 3
                    }
                });
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(sendSingleLocation)
                    .map(() => {
                        return {type: '[chat] transmit single location useless'};
                    });
        });
    // 转发群组位置
    @Effect()
    private transmitGroupLocation$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitGroupLocation)
        .map(toPayload)
        .switchMap((location) => {
            const body = location.msgs.content.msg_body;
            const msgBody = {
                latitude: body.latitude,
                longitude: body.longitude,
                scale: body.scale,
                label: body.label,
                fsize: body.fsize,
                extras : body.extras
            };
            const transmitGroupLocation = global.JIM.sendGroupLocation({
                target_gid: location.select.key,
                msg_body: msgBody,
                need_receipt: true
            })
            .onSuccess((data, msgs) => {
                msgs.key = data.key;
                msgs.unread_count = data.unread_count;
                msgs.msg_type = 4;
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: location.msgs.msgKey,
                        key: location.key,
                        success: 2,
                        msgs,
                        type: 4
                    }
                });
            }).onFail((error) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: location.msgs.msgKey,
                        key: location.key,
                        success: 3,
                        type: 4
                    }
                });
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: location.msgs.msgKey,
                        key: location.key,
                        success: 3,
                        type: 4
                    }
                });
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(transmitGroupLocation)
                    .map(() => {
                        return {type: '[chat] transmit group location useless'};
                    });
        });
    // 查看别人的资料
    @Effect()
    private watchOtherInfo$: Observable<Action> = this.actions$
        .ofType(chatAction.watchOtherInfo)
        .map(toPayload)
        .switchMap((other) => {
            const OtherInfoObj = global.JIM.getUserInfo({
                username: other.username
            }).onSuccess((data) => {
                data.user_info.name = data.user_info.username;
                data.user_info.nickName = data.user_info.nickname;
                data.user_info.infoType = 'watchOtherInfo';
                if (other.hasOwnProperty('avatarUrl') || data.user_info.avatar === '') {
                    data.user_info.avatarUrl = other.avatarUrl ? other.avatarUrl : '';
                    this.store$.dispatch({
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
                        this.store$.dispatch({
                            type: chatAction.watchOtherInfoSuccess,
                            payload: {
                                info: data.user_info,
                                show: true
                            }
                        });
                    }).onFail((error) => {
                        this.store$.dispatch({
                            type: chatAction.watchOtherInfoSuccess,
                            payload: {
                                info: data.user_info,
                                show: true
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
            return Observable.of(OtherInfoObj)
                    .map(() => {
                        return {type: '[chat] watch other info useless'};
                    });
    });
    // 获取群组信息
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
            const groupInfoObj = global.JIM.getGroupInfo({gid: info.active.key})
            .onSuccess((data) => {
                if (data.group_info.avatar && data.group_info.avatar !== '') {
                    global.JIM.getResource({media_id: data.group_info.avatar})
                    .onSuccess((urlInfo) => {
                        data.group_info.avatarUrl = urlInfo.url;
                        this.store$.dispatch({
                            type: chatAction.groupInfo,
                            payload: {
                                groupInfo: data.group_info
                            }
                        });
                    }).onFail((error) => {
                        this.store$.dispatch({
                            type: chatAction.groupInfo,
                            payload: {
                                groupInfo: data.group_info
                            }
                        });
                    }).onTimeout((error) => {
                        this.store$.dispatch({
                            type: chatAction.groupInfo,
                            payload: {
                                groupInfo: data.group_info
                            }
                        });
                    });
                } else {
                    this.store$.dispatch({
                        type: chatAction.groupInfo,
                        payload: {
                            groupInfo: data.group_info
                        }
                    });
                }
            }).onFail((error) => {
                this.store$.dispatch({
                    type: chatAction.groupInfo,
                    payload: {
                        groupInfo: {}
                    }
                });
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                this.store$.dispatch({
                    type: chatAction.groupInfo,
                    payload: {
                        groupInfo: {}
                    }
                });
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(groupInfoObj)
                    .map(() => {
                        return {type: '[chat] group info useless'};
                    });
    });
    // 获取群成员信息
    @Effect()
    private getGroupMembers$: Observable<Action> = this.actions$
        .ofType(chatAction.getGroupMembers)
        .map(toPayload)
        .switchMap((info) => {
            const groupMemberObj = global.JIM.getGroupMembers({gid: info.key})
            .onSuccess((data) => {
                this.util.getMembersFirstLetter(data.member_list);
                this.store$.dispatch({
                    type: chatAction.groupInfo,
                    payload: {
                        memberList: data.member_list,
                        key: info.key
                    }
                });
                for (let member of data.member_list) {
                    if (member.avatar !== '') {
                        global.JIM.getResource({media_id: member.avatar})
                        .onSuccess((urlInfo) => {
                            member.avatarUrl = urlInfo.url;
                            this.store$.dispatch({
                                type: chatAction.groupInfo,
                                payload: {
                                    memberList: data.member_list,
                                    key: info.key
                                }
                            });
                        }).onFail((error) => {
                            //
                        });
                    }
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
            return Observable.of(groupMemberObj)
                    .map(() => {
                        return {type: '[chat] get group memebers useless'};
                    });
    });
    // 更新群组资料
    @Effect()
    private updateGroupInfo$: Observable<Action> = this.actions$
        .ofType(chatAction.updateGroupInfo)
        .map(toPayload)
        .switchMap((info) => {
            let requestObj: any = {
                gid: info.gid
            };
            if (info.actionType && info.actionType === 'modifyName') {
                requestObj.group_name = info.name;
            } else if (info.actionType && info.actionType === 'modifyDescription') {
                requestObj.group_description = info.desc;
            } else if (info.actionType && info.actionType === 'modifyGroupAvatar') {
                requestObj.avatar = info.avatar;
            }
            const groupInfoObj = global.JIM.updateGroupInfo(requestObj)
            .onSuccess((data) => {
                if (info.actionType && info.actionType === 'modifyDescription') {
                    this.store$.dispatch({
                        type: chatAction.groupDescription,
                        payload: {
                            data,
                            show: false
                        }
                    });
                } else if (info.actionType && info.actionType === 'modifyGroupAvatar') {
                    this.store$.dispatch({
                        type: mainAction.showModalTip,
                        payload: {
                            show: true,
                            info: {
                                title: '修改群头像',
                                tip: '修改群头像成功',
                                actionType: '[chat] modify group avatar success useless',
                                success: 1
                            }
                        }
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
            if (active.shield) {
                global.JIM.delGroupShield({gid: active.key})
                .onSuccess((data) => {
                    active.shield = false;
                    this.store$.dispatch({
                        type: chatAction.changeGroupShieldSuccess,
                        payload: active
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
            } else {
                global.JIM.addGroupShield({gid: active.key})
                .onSuccess((data) => {
                    active.shield = true;
                    this.store$.dispatch({
                        type: chatAction.changeGroupShieldSuccess,
                        payload: active
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
            }
            return Observable.of('changeShieldObj')
                    .map(() => {
                        return {type: '[chat] change group shield useless'};
                    });
    });
    // 切换群免打扰
    @Effect()
    private changeGroupNoDisturb$: Observable<Action> = this.actions$
        .ofType(chatAction.changeGroupNoDisturb)
        .map(toPayload)
        .switchMap((active) => {
            if (active.noDisturb) {
                global.JIM.delGroupNoDisturb({gid: active.key})
                .onSuccess((data) => {
                    active.noDisturb = false;
                    this.store$.dispatch({
                        type: chatAction.changeGroupNoDisturbSuccess,
                        payload: active
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
            } else {
                global.JIM.addGroupNoDisturb({gid: active.key})
                .onSuccess((data) => {
                    active.noDisturb = true;
                    this.store$.dispatch({
                        type: chatAction.changeGroupNoDisturbSuccess,
                        payload: active
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
            }
            return Observable.of('changeNoDisturbObj')
                    .map(() => {
                        return {type: '[chat] change group no disturb useless'};
                    });
        });
    // 被添加进群时获取群信息
    @Effect()
    private addGroupMembersEvent$: Observable<Action> = this.actions$
        .ofType(chatAction.addGroupMembersEvent)
        .map(toPayload)
        .switchMap((eventData) => {
            let groupInfoObj = global.JIM.getGroupInfo({gid: eventData.gid})
            .onSuccess((obj) => {
                if (obj.group_info.name && obj.group_info.name !== '') {
                    eventData.name = obj.group_info.name;
                    this.requestGroupAvatarUrl(obj.group_info, (avatarUrl) => {
                        eventData.avatarUrl = avatarUrl || '';
                        this.store$.dispatch({
                            type: chatAction.addGroupMembersEventSuccess,
                            payload: eventData
                        });
                    });
                    let count = 0;
                    for (let userList of eventData.to_usernames) {
                        global.JIM.getUserInfo({
                            username: userList.username
                        }).onSuccess((user) => {
                            if (user.user_info.avatar === '') {
                                count ++;
                                if (count === eventData.to_usernames.length) {
                                    this.store$.dispatch({
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
                                        this.store$.dispatch({
                                            type: chatAction.updateGroupMembersEvent,
                                            payload: {
                                                eventData
                                            }
                                        });
                                    }
                                }).onFail((error) => {
                                    count ++;
                                    if (count === eventData.to_usernames.length) {
                                        this.store$.dispatch({
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
                                this.store$.dispatch({
                                    type: chatAction.updateGroupMembersEvent,
                                    payload: {
                                        eventData
                                    }
                                });
                            }
                        });
                    }
                } else {
                    this.requestGroupName(eventData, (error) => {
                        this.store$.dispatch({
                            type: appAction.errorApiTip,
                            payload: error
                        });
                        eventData.name = '群名获取失败？？';
                        this.requestGroupAvatarUrl(obj.group_info, (avatarUrl) => {
                            eventData.avatarUrl = avatarUrl || '';
                            this.store$.dispatch({
                                type: chatAction.addGroupMembersEventSuccess,
                                payload: eventData
                            });
                        });
                    }, () => {
                        this.requestGroupAvatarUrl(obj.group_info, (avatarUrl) => {
                            eventData.avatarUrl = avatarUrl || '';
                            this.store$.dispatch({
                                type: chatAction.addGroupMembersEventSuccess,
                                payload: eventData
                            });
                        });
                    }, (member, count) => {
                        for (let userList of eventData.to_usernames) {
                            if (userList.username === member.username) {
                                global.JIM.getResource({media_id: member.avatar})
                                .onSuccess((urlInfo) => {
                                    userList.avatarUrl = urlInfo.url;
                                    count ++;
                                    if (count === eventData.to_usernames.length) {
                                        this.store$.dispatch({
                                            type: chatAction.updateGroupMembersEvent,
                                            payload: {
                                                eventData
                                            }
                                        });
                                    }
                                }).onFail((error) => {
                                    count ++;
                                    if (count === eventData.to_usernames.length) {
                                        this.store$.dispatch({
                                            type: chatAction.updateGroupMembersEvent,
                                            payload: {
                                                eventData
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
            }).onFail((error) => {
                this.store$.dispatch({
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
            const groupInfoObj = global.JIM.getGroupInfo({gid: eventData.gid})
            .onSuccess((obj) => {
                eventData.name = obj.group_info.name;
                this.store$.dispatch({
                    type: chatAction.createGroupSuccessEvent,
                    payload: eventData
                });
            })
            .onFail((error) => {
                eventData.name = '群名获取失败？？';
                this.store$.dispatch({
                    type: chatAction.createGroupSuccessEvent,
                    payload: eventData
                });
            }).onTimeout((data) => {
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of('createGroupEvent')
                    .map(() => {
                        return {type: '[chat] create group event useless'};
                    });
    });
    // 消息撤回事件
    @Effect()
    private msgRetract$: Observable<Action> = this.actions$
        .ofType(chatAction.msgRetract)
        .map(toPayload)
        .switchMap((item) => {
            const msgRetract = global.JIM.msgRetract({
                    msg_id: item.msg_id,
                }).onSuccess((data , msg) => {
                    this.store$.dispatch({
                        type: chatAction.msgRetractSuccess,
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
            return Observable.of(msgRetract)
                    .map(() => {
                        return {type: '[chat] create group event useless'};
                    });
    });
    // 添加好友
    @Effect()
    private addFriendConfirm$: Observable<Action> = this.actions$
        .ofType(chatAction.addFriendConfirm)
        .map(toPayload)
        .switchMap((user) => {
            const addFriendConfirm = global.JIM.addFriend({
                    target_name: user.name,
                    from_type: 1,
                    why: user.verifyModalText
                }).onSuccess((data) => {
                    this.store$.dispatch({
                        type: mainAction.showModalTip,
                        payload: {
                            show: true,
                            info: {
                                title: '好友申请',
                                tip: '好友申请发送成功',
                                actionType: '[chat] add friend success',
                                success: 1
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
            return Observable.of(addFriendConfirm)
                    .map(() => {
                        return {type: '[chat] create group event useless'};
                    });
    });
    // 个人资料中取消黑名单
    @Effect()
    private deleteSingleBlack$: Observable<Action> = this.actions$
        .ofType(chatAction.deleteSingleBlack)
        .map(toPayload)
        .switchMap((user) => {
            const deleteSingleBlack = global.JIM.delSingleBlacks({
                    member_usernames: [{username: user.name}]
                }).onSuccess((data) => {
                    this.store$.dispatch({
                        type: mainAction.showModalTip,
                        payload: {
                            show: true,
                            info: {
                                title: '取消黑名单',
                                tip: '取消黑名单成功',
                                actionType: '[chat] delete single black success useless',
                                success: 1
                            }
                        }
                    });
                    this.store$.dispatch({
                        type: chatAction.deleteSingleBlackSuccess,
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
            return Observable.of(deleteSingleBlack)
                    .map(() => {
                        return {type: '[chat] delete single black useless'};
                    });
    });
    // 个人资料中取消免打扰
    @Effect()
    private deleteSingleNoDisturb$: Observable<Action> = this.actions$
        .ofType(chatAction.deleteSingleNoDisturb)
        .map(toPayload)
        .switchMap((user) => {
            const deleteSingleNoDisturb = global.JIM.delSingleNoDisturb({
                    target_name: user.name
                }).onSuccess((data) => {
                    this.store$.dispatch({
                        type: mainAction.showModalTip,
                        payload: {
                            show: true,
                            info: {
                                title: '取消免打扰',
                                tip: '取消免打扰成功',
                                actionType: '[chat] delete single no disturb success useless',
                                success: 1
                            }
                        }
                    });
                    this.store$.dispatch({
                        type: chatAction.deleteSingleNoDisturbSuccess,
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
            return Observable.of(deleteSingleNoDisturb)
                    .map(() => {
                        return {type: '[chat] delete single black useless'};
                    });
    });
    // 修改备注名
    @Effect()
    private saveMemoName$: Observable<Action> = this.actions$
        .ofType(chatAction.saveMemoName)
        .map(toPayload)
        .switchMap((user) => {
            const saveMemoName = global.JIM.updateFriendMemo({
                    target_name: user.name,
                    memo_name: user.memo_name,
                    memo_others: 'a'
                }).onSuccess((data) => {
                    this.store$.dispatch({
                        type: chatAction.saveMemoNameSuccess,
                        payload: {
                            to_usernames: [user]
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
            return Observable.of(saveMemoName)
                    .map(() => {
                        return {type: '[chat] save memo name useless'};
                    });
    });
    // 加载预览图片的图片url
    @Effect()
    private loadViewerImage$: Observable<Action> = this.actions$
        .ofType(chatAction.loadViewerImage)
        .map(toPayload)
        .switchMap((info) => {
            const loadViewerImage = global.JIM.getResource({media_id: info.mediaId})
                .onSuccess((urlInfo) => {
                    info.src = urlInfo.url;
                    this.store$.dispatch({
                        type: chatAction.loadViewerImageSuccess,
                        payload: info
                    });
                }).onFail((error) => {
                    this.store$.dispatch({
                        type: chatAction.loadViewerImageSuccess,
                        payload: info
                    });
                }).onTimeout((data) => {
                    const error = {code: 910000};
                    this.store$.dispatch({
                        type: appAction.errorApiTip,
                        payload: error
                    });
                });
            return Observable.of(loadViewerImage)
                    .map(() => {
                        return {type: '[chat] save memo name useless'};
                    });
    });
    // 加载聊天文件的url
    @Effect()
    private msgFile$: Observable<Action> = this.actions$
        .ofType(chatAction.msgFile)
        .map(toPayload)
        .switchMap((info) => {
            if (!info.show) {
                return Observable.of('msgFile')
                        .map(() => {
                            return {type: '[chat] msg file useless'};
                        });
            }
            let msgs = info.messageList[info.active.activeIndex].msgs;
            let count = 0;
            for (let i = msgs.length - 1; i >= 0; i--) {
                let type = '';
                if (msgs[i].content.msg_type === 'file') {
                    if (msgs[i].content.msg_body.extras) {
                        if (msgs[i].content.msg_body.extras.video) {
                            type = 'video';
                        } else if (msgs[i].content.msg_body.extras.fileType) {
                            type = this.util.sortByExt(msgs[i].content.msg_body.extras.fileType);
                        } else {
                            type = 'other';
                        }
                    }
                }
                if ((type === info.type ||
                    (msgs[i].content.msg_type === info.type && info.type === 'image')) &&
                    !msgs[i].content.msg_body.media_url) {
                    count ++;
                    global.JIM.getResource({media_id: msgs[i].content.msg_body.media_id})
                    .onSuccess((urlInfo) => {
                        msgs[i].content.msg_body.media_url = urlInfo.url;
                        count --;
                        if (count <= 0 && info.type === 'image') {
                            this.store$.dispatch({
                                type: chatAction.msgFileSuccess,
                                payload: {
                                    messageList: info.messageList,
                                    type: info.type,
                                    isFirst: false
                                }
                            });
                        }
                    }).onFail((error) => {
                        count --;
                        if (count <= 0 && info.type === 'image') {
                            this.store$.dispatch({
                                type: chatAction.msgFileSuccess,
                                payload: {
                                    messageList: info.messageList,
                                    type: info.type,
                                    isFirst: false
                                }
                            });
                        }
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
                        count --;
                        if (count <= 0 && info.type === 'image') {
                            this.store$.dispatch({
                                type: chatAction.msgFileSuccess,
                                payload: {
                                    messageList: info.messageList,
                                    type: info.type,
                                    isFirst: false
                                }
                            });
                        }
                    });
                }
            }
            this.store$.dispatch({
                type: chatAction.msgFileSuccess,
                payload: {
                    messageList: info.messageList,
                    type: info.type,
                    isFirst: true
                }
            });
            return Observable.of('msgFile')
                    .map(() => {
                        return {type: '[chat] msg file useless'};
                    });
    });
    // 会话置顶
    @Effect()
    private conversationToTop$: Observable<Action> = this.actions$
        .ofType(chatAction.conversationToTop)
        .map(toPayload)
        .switchMap((info) => {
            let extras;
            if (info.extras.top_time_ms) {
                extras = {};
            } else {
                extras = {
                    top_time_ms: new Date().getTime()
                };
            }
            if (info.type === 3) {
                global.JIM.updateConversation({
                    appkey: info.appkey,
                    username: info.name,
                    extras
                });
            } else if (info.type === 4) {
                global.JIM.updateConversation({
                    gid: info.key,
                    extras
                });
            }
            this.store$.dispatch({
                type: chatAction.conversationToTopSuccess,
                payload: info
            });
            return Observable.of('conversationToTop')
                    .map(() => {
                        return {type: '[chat] conversation to top useless'};
                    });
    });
    // 已读未读列表
    @Effect()
    private watchUnreadList$: Observable<Action> = this.actions$
        .ofType(chatAction.watchUnreadList)
        .map(toPayload)
        .switchMap((message) => {
            global.JIM.msgUnreadList({msg_id: message.msg_id})
            .onSuccess((list) => {
                if (message.unread_count !== list.msg_unread_list.unread_list.length) {
                    message.unread_count = list.msg_unread_list.unread_list.length;
                }
                for (let unread of list.msg_unread_list.unread_list) {
                    this.getUnreadListInfo(list, unread);
                }
                for (let unread of list.msg_unread_list.read_list) {
                    this.getUnreadListInfo(list, unread);
                }
            });
            return Observable.of('watchUnreadList')
                    .map(() => {
                        return {type: '[chat] watch unread list useless'};
                    });
    });
    // 已读回执
    @Effect()
    private addReceiptReport$: Observable<Action> = this.actions$
        .ofType(chatAction.addReceiptReport)
        .map(toPayload)
        .switchMap((readObj) => {
            if (readObj && readObj.msg_id.length === 0) {
                return ;
            }
            // 调用超时或者失败重新调用一次
            if (readObj.type === 3) {
                global.JIM.addSingleReceiptReport({
                    username: readObj.username,
                    msg_ids: readObj.msg_id
                }).onSuccess((data) => {
                    // pass
                }).onFail((error) => {
                    // pass
                }).onTimeout((data) => {
                    // pass
                });
            } else {
                global.JIM.addGroupReceiptReport({
                    gid: readObj.gid,
                    msg_ids: readObj.msg_id
                }).onSuccess((data) => {
                    // pass
                }).onFail((error) => {
                    // pass
                }).onTimeout((data) => {
                    // pass
                });
            }
            return Observable.of('addReceiptReport')
                    .map(() => {
                        return {type: '[chat] add receipt report useless'};
                    });
    });
    // 验证消息请求头像
    @Effect()
    private friendEvent$: Observable<Action> = this.actions$
        .ofType(chatAction.friendEvent)
        .map(toPayload)
        .switchMap((info) => {
            info.type = 3;
            let type;
            if (info.extra === 1) {
                type = chatAction.friendInvitationEventSuccess;
            } else if (info.extra === 2) {
                type = chatAction.friendReplyEventSuccess;
            }
            const friendEvent = global.JIM.getResource({media_id: info.media_id})
            .onSuccess((urlInfo) => {
                info.avatarUrl = urlInfo.url;
                this.store$.dispatch({
                    type,
                    payload: info
                });
            }).onFail((error) => {
                info.avatarUrl = '';
                this.store$.dispatch({
                    type,
                    payload: info
                });
            }).onTimeout((data) => {
                const error = {code: 910000};
                info.avatarUrl = '';
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
                this.store$.dispatch({
                    type,
                    payload: info
                });
            });
            return Observable.of(friendEvent)
                    .map(() => {
                        return {type: '[chat] friend invitation event useless'};
                    });
    });
    // 清空会话未读数
    @Effect()
    private updateUnreadCount$: Observable<Action> = this.actions$
        .ofType(chatAction.updateUnreadCount)
        .map(toPayload)
        .switchMap((active) => {
            if (active.type === 3) {
                if (active.name) {
                    global.JIM._updateSingleUnreadCount({
                        username: active.name
                    });
                }
            } else if (active.type === 4) {
                if (active.key) {
                    global.JIM._updateGroupUnreadCount({
                        gid: active.key,
                    });
                }
            }
            return Observable.of('updateUnreadCount')
                    .map(() => {
                        return {type: '[chat] update unread count useless'};
                    });
    });
    // 更新群信息事件
    @Effect()
    private updateGroupInfoEvent$: Observable<Action> = this.actions$
        .ofType(chatAction.updateGroupInfoEvent)
        .map(toPayload)
        .switchMap((info) => {
            const updateGroupInfoEvent = global.JIM.getGroupInfo({gid: info.gid})
            .onSuccess((data) => {
                if (data.group_info.avatar && data.group_info.avatar !== '') {
                    global.JIM.getResource({media_id: data.group_info.avatar})
                    .onSuccess((urlInfo) => {
                        data.group_info.avatarUrl = urlInfo.url;
                        this.store$.dispatch({
                            type: chatAction.updateGroupInfoEventSuccess,
                            payload: {
                                groupInfo: data.group_info,
                                eventData: info
                            }
                        });
                    }).onFail((error) => {
                        data.group_info.avatarUrl = '';
                        this.store$.dispatch({
                            type: chatAction.updateGroupInfoEventSuccess,
                            payload: {
                                groupInfo: data.group_info,
                                eventData: info
                            }
                        });
                    }).onTimeout((error) => {
                        data.group_info.avatarUrl = '';
                        this.store$.dispatch({
                            type: chatAction.updateGroupInfoEventSuccess,
                            payload: {
                                groupInfo: data.group_info,
                                eventData: info
                            }
                        });
                    });
                } else {
                    data.group_info.avatarUrl = '';
                    this.store$.dispatch({
                        type: chatAction.updateGroupInfoEventSuccess,
                        payload: {
                            groupInfo: data.group_info,
                            eventData: info
                        }
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
            return Observable.of(updateGroupInfoEvent)
                    .map(() => {
                        return {type: '[chat] update group info event useless'};
                    });
    });
    // 验证消息请求头像
    @Effect()
    private userInfUpdateEvent$: Observable<Action> = this.actions$
        .ofType(chatAction.userInfUpdateEvent)
        .map(toPayload)
        .switchMap((info) => {
            info.name = info.from_username;
            info.type = 3;
            global.JIM.getUserInfo({
                username: info.from_username
            }).onSuccess((userInfo) => {
                info.nickName = userInfo.user_info.nickname;
                info = Object.assign({}, info, userInfo.user_info);
                if (!userInfo.user_info.avatar || userInfo.user_info.avatar === '') {
                    info.avatarUrl = '';
                    this.store$.dispatch({
                        type: chatAction.userInfUpdateEventSuccess,
                        payload: info
                    });
                    return;
                }
                global.JIM.getResource({media_id: userInfo.user_info.avatar})
                .onSuccess((urlInfo) => {
                    info.avatarUrl = urlInfo.url;
                    this.store$.dispatch({
                        type: chatAction.userInfUpdateEventSuccess,
                        payload: info
                    });
                }).onFail((error) => {
                    info.avatarUrl = '';
                    this.store$.dispatch({
                        type: chatAction.userInfUpdateEventSuccess,
                        payload: info
                    });
                }).onTimeout(() => {
                    info.avatarUrl = '';
                    this.store$.dispatch({
                        type: chatAction.userInfUpdateEventSuccess,
                        payload: info
                    });
                });
            }).onFail((error) => {
                info.avatarUrl = '';
                this.store$.dispatch({
                    type: chatAction.userInfUpdateEventSuccess,
                    payload: info
                });
            }).onTimeout(() => {
                info.avatarUrl = '';
                this.store$.dispatch({
                    type: chatAction.userInfUpdateEventSuccess,
                    payload: info
                });
            });
            return Observable.of('userInfUpdateEvent')
                    .map(() => {
                        return {type: '[chat] user inf update event useless'};
                    });
    });
    // 清空会话未读数
    @Effect()
    private emptyUnreadNum$: Observable<Action> = this.actions$
        .ofType(chatAction.emptyUnreadNum)
        .map(toPayload)
        .switchMap((unread) => {
            if (unread.type === 3) {
                if (unread.name) {
                    global.JIM.resetUnreadCount({
                        username: unread.name
                    });
                }
            } else if (unread.type === 4) {
                if (unread.key) {
                    global.JIM.resetUnreadCount({
                        gid: unread.key
                    });
                }
            }
            return Observable.of('emptyUnreadNum')
                    .map(() => {
                        return {type: '[chat] update unread count useless'};
                    });
    });
    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private router: Router,
        private storageService: StorageService
    ) {}
    // 获取消息的发送方的头像
    private requestMsgAvatarUrl(messages, obj, count) {
        let username = messages.content.from_id !== global.user ?
                    messages.content.from_id : messages.content.target_id;
        global.JIM.getUserInfo({
            username
        }).onSuccess((user) => {
            if (!user.user_info.avatar || user.user_info.avatar === '') {
                messages.content.avatarUrl = '';
                if (-- count <= 0) {
                    this.store$.dispatch({
                        type: chatAction.receiveMessageSuccess,
                        payload: obj.data
                    });
                }
                return;
            }
            global.JIM.getResource({media_id: user.user_info.avatar})
            .onSuccess((urlInfo) => {
                messages.content.avatarUrl = urlInfo.url;
                if (-- count <= 0) {
                    this.store$.dispatch({
                        type: chatAction.receiveMessageSuccess,
                        payload: obj.data
                    });
                }
            }).onFail((error) => {
                messages.content.avatarUrl = '';
                if (-- count <= 0) {
                    this.store$.dispatch({
                        type: chatAction.receiveMessageSuccess,
                        payload: obj.data
                    });
                }
            });
        }).onFail((error) => {
            if (-- count <= 0) {
                this.store$.dispatch({
                    type: chatAction.receiveMessageSuccess,
                    payload: obj.data
                });
            }
        });
    }
    // 获取会话列表
    private dispatchConversation(count, info, data) {
        if (count <= 0) {
            // let key = `msgId-${authPayload.appKey}-${global.user}`;
            // let msgId = JSON.parse(this.storageService.get(key));
            this.store$.dispatch({
                type: chatAction.getConversationSuccess,
                payload: {
                    conversation: info.conversations,
                    // msgId,
                    storage: true,
                    messageList: data
                }
            });
        }
    }
    //  获取静态资源的url
    private requestMediaUrl(data, count) {
        global.JIM.getResource({media_id: data.messages[0].content.msg_body.media_id})
        .onSuccess((urlInfo) => {
            data.messages[0].content.msg_body.media_url = urlInfo.url;
            if (-- count <= 0) {
                this.store$.dispatch({
                    type: chatAction.receiveMessageSuccess,
                    payload: data
                });
            }
        }).onFail((error) => {
            if (-- count <= 0) {
                this.store$.dispatch({
                    type: chatAction.receiveMessageSuccess,
                    payload: data
                });
            }
            this.store$.dispatch({
                type: appAction.errorApiTip,
                payload: error
            });
        }).onTimeout((errorInfo) => {
            if (-- count <= 0) {
                this.store$.dispatch({
                    type: chatAction.receiveMessageSuccess,
                    payload: data
                });
            }
            const error = {code: 910000};
            this.store$.dispatch({
                type: appAction.errorApiTip,
                payload: error
            });
        });
    }
    // 发送名片获取对方的信息
    private requestCardInfo(data, count) {
        global.JIM.getUserInfo({
            username: data.messages[0].content.msg_body.extras.userName,
            appkey: authPayload.appKey
        }).onSuccess((otherInfo) => {
            data.messages[0].content.msg_body.extras.nickName = otherInfo.user_info.nickname;
            if (otherInfo.user_info.avatar !== '') {
                global.JIM.getResource({media_id: otherInfo.user_info.avatar})
                .onSuccess((urlInfo) => {
                    data.messages[0].content.msg_body.extras.media_url = urlInfo.url;
                    if (-- count <= 0) {
                        this.store$.dispatch({
                            type: chatAction.receiveMessageSuccess,
                            payload: data
                        });
                    }
                }).onFail((error) => {
                    if (-- count <= 0) {
                        this.store$.dispatch({
                            type: chatAction.receiveMessageSuccess,
                            payload: data
                        });
                    }
                }).onTimeout((errorInfo) => {
                    if (-- count <= 0) {
                        this.store$.dispatch({
                            type: chatAction.receiveMessageSuccess,
                            payload: data
                        });
                    }
                });
            }
        }).onFail((error) => {
            if (-- count <= 0) {
                this.store$.dispatch({
                    type: chatAction.receiveMessageSuccess,
                    payload: data
                });
            }
        }).onTimeout(() => {
            if (-- count <= 0) {
                this.store$.dispatch({
                    type: chatAction.receiveMessageSuccess,
                    payload: data
                });
            }
        });
    }
    // 获取未读列表
    private getUnreadListInfo(list, unread) {
        global.JIM.getUserInfo({
            username: unread.username
        }).onSuccess((data) => {
            if (!data.user_info.avatar || data.user_info.avatar === '') {
                unread.avatarUrl = '';
                this.store$.dispatch({
                    type: chatAction.watchUnreadListSuccess,
                    payload: {
                        info: list.msg_unread_list,
                        loading: false
                    }
                });
                return;
            }
            global.JIM.getResource({media_id: data.user_info.avatar})
            .onSuccess((urlInfo) => {
                unread.avatarUrl = urlInfo.url;
                this.store$.dispatch({
                    type: chatAction.watchUnreadListSuccess,
                    payload: {
                        info: list.msg_unread_list,
                        loading: false
                    }
                });
            }).onFail((error) => {
                unread.avatarUrl = '';
                this.store$.dispatch({
                    type: chatAction.watchUnreadListSuccess,
                    payload: {
                        info: list.msg_unread_list,
                        loading: false
                    }
                });
            });
        }).onFail((error) => {
            this.store$.dispatch({
                type: chatAction.watchUnreadListSuccess,
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
                type: chatAction.watchUnreadListSuccess,
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
    // 拼接群名称
    private requestGroupName(eventData, callback1, callback2?, callback3?) {
        global.JIM.getGroupMembers({gid: eventData.key || eventData.gid || eventData.target_id})
        .onSuccess((data) => {
            let name = '';
            let count = 0;
            for (let member of data.member_list) {
                name += (member.nickName || member.nickname ||
                    member.username || member.name) + '、';
                if (callback3) {
                    callback3(member, count);
                }
            }
            if (name.length > 20) {
                eventData.name = name.substr(0, 20);
            } else {
                eventData.name = name.substr(0, name.length - 1);
            }
            eventData.target_name = eventData.name;
            eventData.group_name = eventData.name;
            if (callback2) {
                callback2();
            }
        }).onFail((error) => {
            callback1(error);
        });
    }
    private requestGroupAvatarUrl(groupInfo, callback) {
        global.JIM.getResource({media_id: groupInfo.avatar})
        .onSuccess((urlInfo) => {
            callback(urlInfo.url);
        }).onFail((error) => {
            callback();
        }).onTimeout((errorInfo) => {
            callback();
        });
    }
}

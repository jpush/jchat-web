import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/debounceTime';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { appAction } from '../../../actions';
import {
    global, authPayload, StorageService,
    pageNumber, ApiService
} from '../../../services/common';
import { AppStore } from '../../../app.store';
import { chatAction } from '../actions';
import { mainAction } from '../../main/actions';
import { Util } from '../../../services/util';
import { contactAction } from '../../contact/actions';

@Injectable()
export class ChatEffect {
    // 同步自己发送的消息
    @Effect()
    private syncReceiveMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.syncReceiveMessage)
        .map(toPayload)
        .switchMap(async (info) => {
            let content = info.data.messages[0].content;
            let promises = [];
            // 如果是文件或者图片
            this.getMediaUrl(info, promises);
            // 如果是名片
            this.getCardResource(content, info, promises);
            await Promise.all(promises);
            this.store$.dispatch({
                type: chatAction.receiveMessageSuccess,
                payload: info.data
            });
            return { type: '[chat] sync receive message useless' };
        });
    // 接收到单聊新消息
    @Effect()
    private receiveSingleMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.receiveSingleMessage)
        .map(toPayload)
        .switchMap(async (info) => {
            let promises = [];
            const content = info.data.messages[0].content;
            // 如果接收的是图片或者文件
            this.getMediaUrl(info, promises);
            const result = info.conversation.filter((conversation) => {
                return info.data.messages[0].content.from_id === conversation.name;
            });
            if (result.length === 0) {
                const messages = info.data.messages[0];
                this.getMsgAvatarUrl(messages, promises);
            } else {
                // 给已有的单聊用户添加头像
                content.avatarUrl = result[0].avatarUrl;
            }
            // 如果接收的是名片
            this.getCardResource(content, info, promises);
            await Promise.all(promises);
            this.store$.dispatch({
                type: chatAction.receiveMessageSuccess,
                payload: info.data
            });
            return { type: '[chat] receive single message useless' };
        });
    // 接收到群聊新消息
    @Effect()
    private receiveGroupMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.receiveGroupMessage)
        .map(toPayload)
        .switchMap(async (obj) => {
            let promises = [];
            const messages = obj.data.messages[0];
            const messageList = obj.messageList;
            let flag = false;
            const content = messages.content;
            // 如果接收的是图片或者文件
            this.getMediaUrl(obj, promises);
            // 如果接收的是名片
            this.getCardResource(content, obj, promises);
            // 判断是否消息列表中已经加载过头像
            for (let list of messageList) {
                if (list.type === 4 && Number(list.key) === Number(messages.key)
                    && list.msgs.length > 0) {
                    for (let i = list.msgs.length - 1; i >= 0; i--) {
                        const hasLoadAvatar = list.msgs[i].content.hasOwnProperty('avatarUrl');
                        if (list.msgs[i].content.from_id === messages.content.from_id
                            && hasLoadAvatar) {
                            messages.content.avatarUrl = list.msgs[i].content.avatarUrl;
                            flag = true;
                            break;
                        }
                    }
                    break;
                }
            }
            if (!flag) {
                this.getMsgAvatarUrl(messages, promises);
            }
            await Promise.all(promises);
            this.store$.dispatch({
                type: chatAction.receiveMessageSuccess,
                payload: obj.data
            });
            return { type: '[chat] receive message useless' };
        });
    // 获取storage里的voice状态
    @Effect()
    private getVoiceState$: Observable<Action> = this.actions$
        .ofType(chatAction.getVoiceState)
        .map(toPayload)
        .switchMap(async (key) => {
            const voiceState = this.storageService.get(key);
            if (voiceState) {
                this.store$.dispatch({
                    type: chatAction.getVoiceStateSuccess,
                    payload: JSON.parse(voiceState)
                });
            }
            return { type: '[chat] get voice state useless' };
        });
    // 获取好友列表
    @Effect()
    private getFriendList$: Observable<Action> = this.actions$
        .ofType(chatAction.getFriendList)
        .map(toPayload)
        .switchMap(async (info) => {
            const data: any = await this.apiService.getFriendList();
            if (data.code) {
                this.errorFn(data);
            } else {
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
                    if (friend.avatar && friend.avatar !== '') {
                        const urlObj = { media_id: friend.avatar };
                        this.apiService.getResource(urlObj).then((urlInfo: any) => {
                            if (!urlInfo.code) {
                                friend.avatarUrl = urlInfo.url;
                            }
                        });
                    }
                }
            }
            return { type: '[chat] get friend list useless' };
        });
    // 获取messageList 图片消息url
    @Effect()
    private getSourceUrl$: Observable<Action> = this.actions$
        .ofType(chatAction.getSourceUrl)
        .map(toPayload)
        .switchMap(async (info) => {
            let resourceArray = [];
            const msgs = info.messageList[info.active.activeIndex].msgs;
            const end = msgs.length - (info.loadingCount - 1) * pageNumber;
            this.store$.dispatch({
                type: chatAction.getAllMessageSuccess,
                payload: info.messageList
            });
            // 滚动加载资源路径
            if (end >= 1) {
                for (let i = end - 1; i >= end - pageNumber && i >= 0; i--) {
                    if (msgs[i].hasLoad) {
                        continue;
                    }
                    msgs[i].hasLoad = true;
                    const msgBody = msgs[i].content.msg_body;
                    if (msgBody.media_id && !msgBody.media_url) {
                        const urlObj = { media_id: msgBody.media_id };
                        this.apiService.getResource(urlObj).then((urlInfo: any) => {
                            if (urlInfo.code) {
                                msgs[i].content.msg_body.media_url = '';
                            } else {
                                msgs[i].content.msg_body.media_url = urlInfo.url;
                                this.store$.dispatch({
                                    type: chatAction.getAllMessageSuccess,
                                    payload: info.messageList
                                });
                            }
                        });
                    } else if (msgBody.extras && msgBody.extras.businessCard) {
                        const userObj = {
                            username: msgBody.extras.userName
                        };
                        this.apiService.getUserInfo(userObj).then((data: any) => {
                            if (!data.code) {
                                msgBody.extras.nickName = data.user_info.nickname;
                                msgBody.extras.media_url = '';
                                if (data.user_info.avatar !== '') {
                                    const urlObj = { media_id: data.user_info.avatar };
                                    this.apiService.getResource(urlObj).then((urlInfo: any) => {
                                        if (!urlInfo.code) {
                                            msgBody.extras.media_url = urlInfo.url;
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            }
            return { type: '[chat] get source url useless' };
        });
    // 获取messageList avatar url
    @Effect()
    private getMemberAvatarUrl$: Observable<Action> = this.actions$
        .ofType(chatAction.getMemberAvatarUrl)
        .map(toPayload)
        .switchMap(async (info) => {
            let userArr = [];
            const msgs = info.messageList[info.active.activeIndex].msgs;
            const end = msgs.length - (info.loadingCount - 1) * pageNumber;
            this.store$.dispatch({
                type: chatAction.getAllMessageSuccess,
                payload: info.messageList
            });
            for (let i = end - 1; i >= end - pageNumber && i >= 0 && end >= 1; i--) {
                // 如果是已经加载过头像的用户
                if (info.loadingCount !== 1) {
                    let flag = false;
                    for (let j = end; j < msgs.length; j++) {
                        if (msgs[i].content.from_id === msgs[j].content.from_id) {
                            if (msgs[j].content.avatarUrl) {
                                msgs[i].content.avatarUrl = msgs[j].content.avatarUrl;
                                flag = true;
                            }
                            break;
                        }
                    }
                    if (flag) {
                        continue;
                    }
                }
                msgs[i].content.avatarUrl = '';
                // 第一次加载头像的用户
                if (msgs[i].content.from_id !== global.user &&
                    userArr.indexOf(msgs[i].content.from_id) < 0) {
                    userArr.push(msgs[i].content.from_id);
                }
            }
            for (let user of userArr) {
                const userObj = {
                    username: user
                };
                this.apiService.getUserInfo(userObj).then((data: any) => {
                    if (!data.code && data.user_info.avatar !== '') {
                        const urlObj = { media_id: data.user_info.avatar };
                        this.apiService.getResource(urlObj).then((urlInfo: any) => {
                            if (!urlInfo.code) {
                                for (let i = end - 1; i >= end - pageNumber && i >= 0 && end >= 1; i--) {
                                    if (msgs[i].content.from_id === user) {
                                        msgs[i].content.avatarUrl = urlInfo.url;
                                    }
                                }
                            }
                        });
                    }
                });
            }
            return { type: '[chat] get member avatar url useless' };
        });
    // 获取所有漫游同步消息、获取群屏蔽列表、获取免打扰列表
    @Effect()
    private getAllMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.getAllMessage)
        .map(toPayload)
        .switchMap(async (data) => {
            for (let dataItem of data) {
                for (let j = 0; j < dataItem.msgs.length; j++) {
                    if (j + 1 < dataItem.msgs.length || dataItem.msgs.length === 1) {
                        if (j === 0) {
                            dataItem.msgs[j].time_show =
                                Util.reducerDate(dataItem.msgs[j].ctime_ms);
                        }
                        if (j + 1 !== dataItem.msgs.length) {
                            if (Util.fiveMinutes(dataItem.msgs[j].ctime_ms,
                                dataItem.msgs[j + 1].ctime_ms)) {
                                dataItem.msgs[j + 1].time_show =
                                    Util.reducerDate(dataItem.msgs[j + 1].ctime_ms);
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
            const info: any = await this.apiService.getConversation();
            if (info.code) {
                this.errorFn(info);
            } else {
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
                let promises = [];
                for (let conversation of info.conversations) {
                    if (conversation.type === 4 && conversation.name === '') {
                        const groupObj = { gid: conversation.key };
                        const pro = this.apiService.getGroupMembers(groupObj).then((group: any) => {
                            if (group.code) {
                                conversation.name = '#群名获取失败？？';
                                this.errorFn(group);
                            } else {
                                let name = '';
                                for (let member of group.member_list) {
                                    name += (member.nickName || member.nickname ||
                                        member.username || member.name) + '、';
                                }
                                if (name.length > 20) {
                                    conversation.name = name.substr(0, 20);
                                } else {
                                    conversation.name = name.substr(0, name.length - 1);
                                }
                                conversation.target_name = conversation.name;
                                conversation.group_name = conversation.name;
                            }
                        });
                        promises.push(pro);
                    }
                }
                // 获取免打扰列表
                let noDisturb;
                const pro1 = this.apiService.getNoDisturb().then((noDisturbList: any) => {
                    if (noDisturbList.code) {
                        this.errorFn(noDisturbList);
                    } else {
                        noDisturb = noDisturbList.no_disturb;
                    }
                });
                let shield;
                // 获取屏蔽列表
                const pro2 = this.apiService.groupShieldList().then((groupList: any) => {
                    if (groupList.code) {
                        this.errorFn(groupList);
                    } else {
                        shield = groupList.groups;
                    }
                });
                promises.push(pro1);
                promises.push(pro2);
                await Promise.all(promises);
                this.store$.dispatch({
                    type: chatAction.getConversationSuccess,
                    payload: {
                        conversation: info.conversations,
                        storage: true,
                        messageList: data,
                        noDisturb,
                        shield
                    }
                });
                this.store$.dispatch({
                    type: chatAction.getFriendList,
                    payload: 'first'
                });
                this.store$.dispatch({
                    type: contactAction.getGroupList,
                    payload: 'first'
                });
                // 加载会话头像
                for (let conversation of info.conversations) {
                    if (conversation.avatar && conversation.avatar !== '') {
                        const urlObj = { media_id: conversation.avatar };
                        this.apiService.getResource(urlObj).then((urlInfo: any) => {
                            if (!urlInfo.code) {
                                conversation.avatarUrl = urlInfo.url;
                            }
                        });
                    }
                }
            }
            return { type: '[chat] get all messageList useless' };
        });
    // 发送单人文本消息
    @Effect()
    private sendMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.sendSingleMessage)
        .map(toPayload)
        .filter((data) => {
            if (!data.singleMsg.content) {
                return false;
            }
            return data;
        }).switchMap(async (text) => {
            const msgs: any = await this.apiService.sendSingleMsg(text.singleMsg);
            if (msgs.code) {
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
                this.errorFn(msgs);
            } else {
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
            }
            return { type: '[chat] send single message useless' };
        });
    // 转发单人文本消息
    @Effect()
    private transmitMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitSingleMessage)
        .map(toPayload)
        .switchMap(async (text) => {
            const msgBody = {
                text: text.msgs.content.msg_body.text,
                extras: text.msgs.content.msg_body.extras
            };
            const msgObj = {
                target_username: text.select.name,
                target_nickname: text.select.nickName,
                msg_body: msgBody,
                need_receipt: true
            };
            const msgs: any = await this.apiService.sendSingleMsg(msgObj);
            if (msgs.code) {
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
                if (text.transmitMsg) {
                    msgs.text = text.select.memo_name || text.select.nickName || text.select.name;
                }
                this.errorFn(msgs);
            } else {
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
            }
            return { type: '[chat] transmit single message useless' };
        });
    // 发送群组文本消息
    @Effect()
    private sendGroupMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.sendGroupMessage)
        .map(toPayload)
        .filter((data) => {
            if (!data.groupMsg.content) {
                return false;
            }
            return data;
        }).switchMap(async (text) => {
            const msgs: any = await this.apiService.sendGroupMsg(text.groupMsg);
            if (msgs.code) {
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.key,
                        success: 3,
                        type: 4
                    }
                });
                this.errorFn(msgs);
            } else {
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
            }
            return { type: '[chat] send group message useless' };
        });
    // 转发群组文本消息
    @Effect()
    private transmitGroupMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitGroupMessage)
        .map(toPayload)
        .switchMap(async (text) => {
            const msgBody = {
                text: text.msgs.content.msg_body.text,
                extras: text.msgs.content.msg_body.extras
            };
            const msgObj = {
                target_gid: text.select.key,
                target_gname: text.select.name,
                msg_body: msgBody,
                need_receipt: true
            };
            const msgs: any = await this.apiService.sendGroupMsg(msgObj);
            if (msgs.code) {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: text.msgs.msgKey,
                        key: text.select.key,
                        success: 3,
                        type: 4
                    }
                });
                if (text.transmitMsg) {
                    msgs.text = text.select.name;
                }
                this.errorFn(msgs);
            } else {
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
            }
            return { type: '[chat] transmit group message useless' };
        });
    // 发送单聊图片消息
    @Effect()
    private sendSinglePic$: Observable<Action> = this.actions$
        .ofType(chatAction.sendSinglePic)
        .map(toPayload)
        .switchMap(async (img) => {
            const msgs: any = await this.apiService.sendSinglePic(img.singlePicFormData);
            if (msgs.code) {
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
                this.errorFn(msgs);
            } else {
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
            }
            return { type: '[chat] send single picture useless' };
        });
    // 转发单聊图片消息
    @Effect()
    private transmitSinglePic$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitSinglePic)
        .map(toPayload)
        .switchMap(async (img) => {
            const body = img.msgs.content.msg_body;
            const msgBody = {
                media_id: body.media_id,
                media_crc32: body.media_crc32,
                width: body.width,
                height: body.height,
                format: body.format,
                fsize: body.fsize,
                extras: body.extras
            };
            const msgObj = {
                target_username: img.select.name,
                msg_body: msgBody,
                need_receipt: true
            };
            const msgs: any = await this.apiService.sendSinglePic(msgObj);
            if (msgs.code) {
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
                if (img.transmitMsg) {
                    msgs.text = img.select.memo_name || img.select.nickName || img.select.name;
                }
                this.errorFn(msgs);
            } else {
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
            }
            return { type: '[chat] transmit single picture useless' };
        });
    // 发送群组图片消息
    @Effect()
    private sendGroupPic$: Observable<Action> = this.actions$
        .ofType(chatAction.sendGroupPic)
        .map(toPayload)
        .switchMap(async (img) => {
            const msgs: any = await this.apiService.sendGroupPic(img.groupPicFormData);
            if (msgs.code) {
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 3,
                        type: 4
                    }
                });
                this.errorFn(msgs);
            } else {
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
            }
            return { type: '[chat] send group pic useless' };
        });
    // 转发群组图片消息
    @Effect()
    private transmitGroupPic$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitGroupPic)
        .map(toPayload)
        .switchMap(async (img) => {
            const body = img.msgs.content.msg_body;
            const msgBody = {
                media_id: body.media_id,
                media_crc32: body.media_crc32,
                width: body.width,
                height: body.height,
                format: body.format,
                fsize: body.fsize,
                extras: body.extras
            };
            const msgObj = {
                target_gid: img.select.key,
                msg_body: msgBody,
                need_receipt: true
            };
            const msgs: any = await this.apiService.sendGroupPic(msgObj);
            if (msgs.code) {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: img.msgs.msgKey,
                        key: img.key,
                        success: 3,
                        type: 4
                    }
                });
                if (img.transmitMsg) {
                    msgs.text = img.select.name;
                }
                this.errorFn(msgs);
            } else {
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
            }
            return { type: '[chat] transmit group pic useless' };
        });
    // 发送单聊文件消息
    @Effect()
    private sendSingleFile$: Observable<Action> = this.actions$
        .ofType(chatAction.sendSingleFile)
        .map(toPayload)
        .switchMap(async (file) => {
            const msgs: any = this.apiService.sendSingleFile(file.singleFile);
            if (msgs.code) {
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
                this.errorFn(msgs);
            } else {
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
            }
            return { type: '[chat] send single file useless' };
        });
    // 转发单聊文件消息
    @Effect()
    private transmitSingleFile$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitSingleFile)
        .map(toPayload)
        .switchMap(async (file) => {
            const body = file.msgs.content.msg_body;
            const msgBody = {
                media_id: body.media_id,
                media_crc32: body.media_crc32,
                hash: body.hash,
                fname: body.fname,
                fsize: body.fsize,
                extras: body.extras
            };
            const msgObj = {
                target_username: file.select.name,
                msg_body: msgBody,
                need_receipt: true
            };
            const msgs: any = await this.apiService.sendSingleFile(msgObj);
            if (msgs.code) {
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
                if (file.transmitMsg) {
                    msgs.text = file.select.memo_name || file.select.nickName || file.select.name;
                }
                this.errorFn(msgs);
            } else {
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
            }
            return { type: '[chat] transmit single file useless' };
        });
    // 发送群组文件消息
    @Effect()
    private sendGroupFile$: Observable<Action> = this.actions$
        .ofType(chatAction.sendGroupFile)
        .map(toPayload)
        .switchMap(async (file) => {
            const msgs: any = await this.apiService.sendGroupFile(file.groupFile);
            if (msgs.code) {
                this.store$.dispatch({
                    type: chatAction.sendMsgComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 3,
                        type: 4
                    }
                });
                this.errorFn(msgs);
            } else {
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
            }
            return { type: '[chat] send group file useless' };
        });
    // 转发群组文件消息
    @Effect()
    private transmitGroupFile$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitGroupFile)
        .map(toPayload)
        .switchMap(async (file) => {
            const body = file.msgs.content.msg_body;
            const msgBody = {
                media_id: body.media_id,
                media_crc32: body.media_crc32,
                hash: body.hash,
                fname: body.fname,
                fsize: body.fsize,
                extras: body.extras
            };
            const msgObj = {
                target_gid: file.select.key,
                msg_body: msgBody,
                need_receipt: true
            };
            const msgs: any = await this.apiService.sendGroupFile(msgObj);
            if (msgs.code) {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: file.msgs.msgKey,
                        key: file.key,
                        success: 3,
                        type: 4
                    }
                });
                if (file.transmitMsg) {
                    msgs.text = file.select.name;
                }
                this.errorFn(msgs);
            } else {
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
            }
            return { type: '[chat] transmit group file useless' };
        });
    // 转发单聊位置消息
    @Effect()
    private transmitSingleLocation$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitSingleLocation)
        .map(toPayload)
        .switchMap(async (location) => {
            const body = location.msgs.content.msg_body;
            const msgBody = {
                latitude: body.latitude,
                longitude: body.longitude,
                scale: body.scale,
                label: body.label,
                fsize: body.fsize,
                extras: body.extras
            };
            const msgObj = {
                target_username: location.select.name,
                msg_body: msgBody,
                need_receipt: true
            };
            const msgs: any = await this.apiService.sendSingleLocation(msgObj);
            if (msgs.code) {
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
                if (location.transmitMsg) {
                    msgs.text = location.select.memo_name ||
                        location.select.nickName || location.select.name;
                }
                this.errorFn(msgs);
            } else {
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
            }
            return { type: '[chat] transmit single location useless' };
        });
    // 转发群组位置消息
    @Effect()
    private transmitGroupLocation$: Observable<Action> = this.actions$
        .ofType(chatAction.transmitGroupLocation)
        .map(toPayload)
        .switchMap(async (location) => {
            const body = location.msgs.content.msg_body;
            const msgBody = {
                latitude: body.latitude,
                longitude: body.longitude,
                scale: body.scale,
                label: body.label,
                fsize: body.fsize,
                extras: body.extras
            };
            const msgObj = {
                target_gid: location.select.key,
                msg_body: msgBody,
                need_receipt: true
            };
            const msgs: any = await this.apiService.sendGroupLocation(msgObj);
            if (msgs.code) {
                this.store$.dispatch({
                    type: chatAction.transmitMessageComplete,
                    payload: {
                        msgKey: location.msgs.msgKey,
                        key: location.key,
                        success: 3,
                        type: 4
                    }
                });
                if (location.transmitMsg) {
                    msgs.text = location.select.name;
                }
                this.errorFn(msgs);
            } else {
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
            }
            return { type: '[chat] transmit group location useless' };
        });
    // 查看别人的资料
    @Effect()
    private watchOtherInfo$: Observable<Action> = this.actions$
        .ofType(chatAction.watchOtherInfo)
        .map(toPayload)
        .switchMap(async (other) => {
            const userObj = {
                username: other.username
            };
            const data: any = await this.apiService.getUserInfo(userObj);
            if (data.code) {
                this.errorFn(data);
            } else {
                data.user_info.name = data.user_info.username;
                data.user_info.nickName = data.user_info.nickname;
                data.user_info.infoType = 'watchOtherInfo';
                if (other.hasOwnProperty('avatarUrl') || data.user_info.avatar === '') {
                    data.user_info.avatarUrl = other.avatarUrl ? other.avatarUrl : '';
                } else {
                    const urlObj = { media_id: data.user_info.avatar };
                    const urlInfo: any = await this.apiService.getResource(urlObj);
                    if (!urlInfo.code) {
                        data.user_info.avatarUrl = urlInfo.url;
                    }
                }
                this.store$.dispatch({
                    type: chatAction.watchOtherInfoSuccess,
                    payload: {
                        info: data.user_info,
                        show: true
                    }
                });
            }
            return { type: '[chat] watch other info useless' };
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
        }).switchMap(async (info) => {
            const activeObj = { gid: info.active.key };
            const data: any = await this.apiService.getGroupInfo(activeObj);
            if (data.code) {
                this.store$.dispatch({
                    type: chatAction.groupInfo,
                    payload: {
                        groupInfo: {}
                    }
                });
                this.errorFn(data);
            } else {
                if (data.group_info.avatar && data.group_info.avatar !== '') {
                    const urlObj = { media_id: data.group_info.avatar };
                    const urlInfo: any = await this.apiService.getResource(urlObj);
                    if (!urlInfo.code) {
                        data.group_info.avatarUrl = urlInfo.url;
                    }
                }
                this.store$.dispatch({
                    type: chatAction.groupInfo,
                    payload: {
                        groupInfo: data.group_info
                    }
                });
            }
            return { type: '[chat] group setting useless' };
        });
    // 获取群成员信息
    @Effect()
    private getGroupMembers$: Observable<Action> = this.actions$
        .ofType(chatAction.getGroupMembers)
        .map(toPayload)
        .switchMap(async (info) => {
            const infoObj = { gid: info.key };
            const data: any = await this.apiService.getGroupMembers(infoObj);
            if (data.code) {
                this.errorFn(data);
            } else {
                Util.getMembersFirstLetter(data.member_list);
                this.store$.dispatch({
                    type: chatAction.groupInfo,
                    payload: {
                        memberList: data.member_list,
                        key: info.key
                    }
                });
                for (let member of data.member_list) {
                    if (member.avatar !== '') {
                        const urlObj = { media_id: member.avatar };
                        this.apiService.getResource(urlObj).then((result: any) => {
                            if (!result.code) {
                                member.avatarUrl = result.url;
                                this.store$.dispatch({
                                    type: chatAction.groupInfo,
                                    payload: {
                                        memberList: data.member_list,
                                        key: info.key
                                    }
                                });
                            }
                        });
                    }
                }
            }
            return { type: '[chat] get group memebers useless' };
        });
    // 更新群组资料
    @Effect()
    private updateGroupInfo$: Observable<Action> = this.actions$
        .ofType(chatAction.updateGroupInfo)
        .map(toPayload)
        .switchMap(async (info) => {
            let requestObj: any = {
                gid: info.gid
            };
            if (info.actionType) {
                if (info.actionType === 'modifyName') {
                    requestObj.group_name = info.name;
                } else if (info.actionType === 'modifyDescription') {
                    requestObj.group_description = info.desc;
                } else if (info.actionType === 'modifyGroupAvatar') {
                    requestObj.avatar = info.avatar;
                }
            }
            const data: any = this.apiService.updateGroupInfo(requestObj);
            if (data.code) {
                this.errorFn(data);
            } else {
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
            }
            return { type: '[chat] update group info useless' };
        });
    // 切换群屏蔽
    @Effect()
    private changeGroupShield$: Observable<Action> = this.actions$
        .ofType(chatAction.changeGroupShield)
        .map(toPayload)
        .switchMap(async (active) => {
            const activeObj = { gid: active.key };
            let data: any;
            if (active.shield) {
                data = await this.apiService.delGroupShield(activeObj);
            } else {
                data = await this.apiService.addGroupShield(activeObj);
            }
            if (data.code) {
                this.errorFn(data);
            } else {
                active.shield = !active.shield;
                this.store$.dispatch({
                    type: chatAction.changeGroupShieldSuccess,
                    payload: active
                });
            }
            return { type: '[chat] change group shield useless' };
        });
    // 切换群免打扰
    @Effect()
    private changeGroupNoDisturb$: Observable<Action> = this.actions$
        .ofType(chatAction.changeGroupNoDisturb)
        .map(toPayload)
        .switchMap(async (active) => {
            const activeObj = { gid: active.key };
            let data: any;
            if (active.noDisturb) {
                data = await this.apiService.delGroupNoDisturb(activeObj);
            } else {
                data = await this.apiService.addGroupNoDisturb(activeObj);
            }
            if (data.code) {
                this.errorFn(data);
            } else {
                active.noDisturb = !active.noDisturb;
                this.store$.dispatch({
                    type: chatAction.changeGroupNoDisturbSuccess,
                    payload: active
                });
            }
            return { type: '[chat] change group no disturb useless' };
        });
    // 被添加进群时获取群信息
    @Effect()
    private addGroupMembersEvent$: Observable<Action> = this.actions$
        .ofType(chatAction.addGroupMembersEvent)
        .map(toPayload)
        .switchMap(async (eventData) => {
            if (eventData.group_name && eventData.group_name !== '') {
                eventData.name = eventData.group_name;
                let promises = [];
                for (let userList of eventData.to_usernames) {
                    if (userList.avatar && userList.avatar !== '') {
                        const avatarObj = { media_id: userList.avatar };
                        const pro = this.apiService.getResource(avatarObj).then((urlInfo: any) => {
                            if (!urlInfo.code) {
                                userList.avatarUrl = urlInfo.url;
                            }
                        });
                        promises.push(pro);
                    }
                }
                Promise.all(promises).then(() => {
                    this.store$.dispatch({
                        type: chatAction.updateGroupMembersEvent,
                        payload: {
                            eventData
                        }
                    });
                });
            } else {
                const groupObj = { gid: eventData.gid };
                const data: any = await this.apiService.getGroupMembers(groupObj);
                if (data.code) {
                    this.errorFn(data);
                    eventData.name = '#群名获取失败？？';
                } else {
                    let name = '';
                    let promises = [];
                    for (let member of data.member_list) {
                        name += (member.nickName || member.nickname ||
                            member.username || member.name) + '、';
                        for (let userList of eventData.to_usernames) {
                            if (userList.username === member.username) {
                                const urlObj = { media_id: member.avatar };
                                const pro = this.apiService.getResource(urlObj)
                                    .then((urlInfo: any) => {
                                        if (!urlInfo.code) {
                                            userList.avatarUrl = urlInfo.url;
                                        }
                                    });
                                promises.push(pro);
                                break;
                            }
                        }
                    }
                    Promise.all(promises).then(() => {
                        this.store$.dispatch({
                            type: chatAction.updateGroupMembersEvent,
                            payload: {
                                eventData
                            }
                        });
                    });
                    if (name.length > 20) {
                        eventData.name = name.substr(0, 20);
                    } else {
                        eventData.name = name.substr(0, name.length - 1);
                    }
                    eventData.target_name = eventData.name;
                    eventData.group_name = eventData.name;
                }
            }
            const urlObj = { media_id: eventData.media_id };
            this.apiService.getResource(urlObj).then((result: any) => {
                if (result.code) {
                    eventData.avatarUrl = '';
                } else {
                    eventData.avatarUrl = result.url;
                }
                this.store$.dispatch({
                    type: chatAction.addGroupMembersEventSuccess,
                    payload: eventData
                });
            });
            return { type: '[chat] add group members event useless' };
        });
    // 创建群组事件
    @Effect()
    private createGroupEvent$: Observable<Action> = this.actions$
        .ofType(chatAction.createGroupEvent)
        .map(toPayload)
        .switchMap(async (eventData) => {
            const groupObj = { gid: eventData.gid };
            const data: any = await this.apiService.getGroupInfo(groupObj);
            if (data.code) {
                eventData.name = '#群名获取失败？？';
            } else {
                eventData.name = data.group_info.name;
            }
            this.store$.dispatch({
                type: chatAction.createGroupSuccessEvent,
                payload: eventData
            });
            return { type: '[chat] create group event useless' };
        });
    // 消息撤回
    @Effect()
    private msgRetract$: Observable<Action> = this.actions$
        .ofType(chatAction.msgRetract)
        .map(toPayload)
        .switchMap(async (item) => {
            const msgObj = {
                msg_id: item.msg_id,
            };
            const data: any = await this.apiService.msgRetract(msgObj);
            if (data.code) {
                this.errorFn(data);
            } else {
                this.store$.dispatch({
                    type: chatAction.msgRetractSuccess,
                    payload: item
                });
            }
            return { type: '[chat] msg eetract useless' };
        });
    // 添加好友
    @Effect()
    private addFriendConfirm$: Observable<Action> = this.actions$
        .ofType(chatAction.addFriendConfirm)
        .map(toPayload)
        .switchMap(async (user) => {
            const friendObj = {
                target_name: user.name,
                from_type: 1,
                why: user.verifyModalText
            };
            const data: any = await this.apiService.addFriend(friendObj);
            if (data.code) {
                this.errorFn(data);
            } else {
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
            }
            return { type: '[chat] add friend confirm useless' };
        });
    // 个人资料中取消黑名单
    @Effect()
    private deleteSingleBlack$: Observable<Action> = this.actions$
        .ofType(chatAction.deleteSingleBlack)
        .map(toPayload)
        .switchMap(async (user) => {
            const userObj = {
                member_usernames: [{ username: user.name }]
            };
            const data: any = await this.apiService.delSingleBlacks(userObj);
            if (data.code) {
                this.errorFn(data);
            } else {
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
            }
            return { type: '[chat] delete single black useless' };
        });
    // 个人资料中取消免打扰
    @Effect()
    private deleteSingleNoDisturb$: Observable<Action> = this.actions$
        .ofType(chatAction.deleteSingleNoDisturb)
        .map(toPayload)
        .switchMap(async (user) => {
            const userObj = {
                target_name: user.name
            };
            const data: any = await this.apiService.delSingleNoDisturb(userObj);
            if (data.code) {
                this.errorFn(data);
            } else {
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
            }
            return { type: '[chat] delete single no disturb useless' };
        });
    // 修改备注名
    @Effect()
    private saveMemoName$: Observable<Action> = this.actions$
        .ofType(chatAction.saveMemoName)
        .map(toPayload)
        .switchMap(async (user) => {
            const friendObj = {
                target_name: user.name,
                memo_name: user.memo_name,
                memo_others: 'a'
            };
            const data: any = await this.apiService.updateFriendMemo(friendObj);
            if (data.code) {
                this.errorFn(data);
            } else {
                this.store$.dispatch({
                    type: chatAction.saveMemoNameSuccess,
                    payload: {
                        to_usernames: [user]
                    }
                });
            }
            return { type: '[chat] save memo name useless' };
        });
    // 加载预览图片的图片url
    @Effect()
    private loadViewerImage$: Observable<Action> = this.actions$
        .ofType(chatAction.loadViewerImage)
        .map(toPayload)
        .switchMap(async (info) => {
            const urlObj = { media_id: info.mediaId };
            const data: any = await this.apiService.getResource(urlObj);
            if (data.code) {
                this.errorFn(data);
            } else {
                info.src = data.url;
                this.store$.dispatch({
                    type: chatAction.loadViewerImageSuccess,
                    payload: info
                });
            }
            return { type: '[chat] load viewer image useless' };
        });
    // 加载聊天文件的url
    @Effect()
    private msgFile$: Observable<Action> = this.actions$
        .ofType(chatAction.msgFile)
        .map(toPayload)
        .switchMap(async (info) => {
            if (info.show) {
                const msgs = info.messageList[info.active.activeIndex].msgs;
                let promises = [];
                for (let i = msgs.length - 1; i >= 0; i--) {
                    let type = '';
                    if (msgs[i].content.msg_type === 'file') {
                        if (msgs[i].content.msg_body.extras) {
                            if (msgs[i].content.msg_body.extras.video) {
                                type = 'video';
                            } else if (msgs[i].content.msg_body.extras.fileType) {
                                type = Util.sortByExt(msgs[i].content.msg_body.extras.fileType);
                            } else {
                                type = 'other';
                            }
                        }
                    }
                    if ((type === info.type ||
                        (msgs[i].content.msg_type === info.type && info.type === 'image')) &&
                        !msgs[i].content.msg_body.media_url) {
                        const urlObj = { media_id: msgs[i].content.msg_body.media_id };
                        const pro = this.apiService.getResource(urlObj).then((result: any) => {
                            if (!result.code) {
                                msgs[i].content.msg_body.media_url = result.url;
                            }
                        });
                        promises.push(pro);
                    }
                    if (promises.length > 0 && info.type === 'image') {
                        Promise.all(promises).then(() => {
                            this.store$.dispatch({
                                type: chatAction.msgFileSuccess,
                                payload: {
                                    messageList: info.messageList,
                                    type: info.type,
                                    isFirst: false
                                }
                            });
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
            }
            return { type: '[chat] msg file useless' };
        });
    // 会话置顶和取消会话置顶
    @Effect()
    private conversationToTop$: Observable<Action> = this.actions$
        .ofType(chatAction.conversationToTop)
        .map(toPayload)
        .switchMap(async (info) => {
            let extras;
            let conversation;
            if (info.extras.top_time_ms) {
                extras = {};
            } else {
                extras = {
                    top_time_ms: new Date().getTime()
                };
            }
            if (info.type === 3) {
                conversation = {
                    appkey: info.appkey,
                    username: info.name,
                    extras
                };
            } else if (info.type === 4) {
                conversation = {
                    gid: info.key,
                    extras
                };
            }
            if (conversation) {
                this.apiService.updateConversation(conversation);
                this.store$.dispatch({
                    type: chatAction.conversationToTopSuccess,
                    payload: info
                });
            }
            return { type: '[chat] conversation to top useless' };
        });
    // 已读未读列表
    @Effect()
    private watchUnreadList$: Observable<Action> = this.actions$
        .ofType(chatAction.watchUnreadList)
        .map(toPayload)
        .switchMap(async (info) => {
            if (info.message) {
                const msgObj = { msg_id: info.message.msg_id };
                const data: any = await this.apiService.msgUnreadList(msgObj);
                if (data.code) {
                    this.store$.dispatch({
                        type: chatAction.watchUnreadList,
                        payload: {
                            show: false
                        }
                    });
                    this.errorFn(data);
                } else {
                    if (info.message.unread_count !== data.msg_unread_list.unread_list.length) {
                        info.message.unread_count = data.msg_unread_list.unread_list.length;
                    }
                    this.store$.dispatch({
                        type: chatAction.watchUnreadListSuccess,
                        payload: {
                            info: data.msg_unread_list,
                            loading: false
                        }
                    });
                    for (let unread of data.msg_unread_list.unread_list) {
                        this.getUnreadListInfo(data, unread);
                    }
                    for (let unread of data.msg_unread_list.read_list) {
                        this.getUnreadListInfo(data, unread);
                    }
                }
            }
            return { type: '[chat] watch unread list useless' };
        });
    // 已读回执
    @Effect()
    private addReceiptReport$: Observable<Action> = this.actions$
        .ofType(chatAction.addReceiptReport)
        .map(toPayload)
        .switchMap(async (readObj) => {
            if (readObj && readObj.msg_id.length > 0) {
                if (readObj.type === 3) {
                    const singleObj = {
                        username: readObj.username,
                        msg_ids: readObj.msg_id
                    };
                    this.apiService.addSingleReceiptReport(singleObj);
                } else {
                    const groupObj = {
                        gid: readObj.gid,
                        msg_ids: readObj.msg_id
                    };
                    this.apiService.addGroupReceiptReport(groupObj);
                }
            }
            return { type: '[chat] add receipt report useless' };
        });
    // 验证消息请求头像
    @Effect()
    private friendEvent$: Observable<Action> = this.actions$
        .ofType(chatAction.friendEvent)
        .map(toPayload)
        .switchMap(async (info) => {
            info.type = 3;
            let type;
            if (info.extra === 1) {
                type = chatAction.friendInvitationEventSuccess;
            } else if (info.extra === 2) {
                type = chatAction.friendReplyEventSuccess;
            }
            info.avatarUrl = '';
            if (info.media_id || info.media_id !== '') {
                const urlObj = { media_id: info.media_id };
                const data: any = await this.apiService.getResource(urlObj);
                if (!data.code) {
                    info.avatarUrl = data.url;
                }
            }
            this.store$.dispatch({
                type,
                payload: info
            });
            return { type: '[chat] friend event useless' };
        });
    // 更新群信息事件
    @Effect()
    private updateGroupInfoEvent$: Observable<Action> = this.actions$
        .ofType(chatAction.updateGroupInfoEvent)
        .map(toPayload)
        .switchMap(async (info) => {
            const groupObj = { gid: info.gid };
            const data: any = await this.apiService.getGroupInfo(groupObj);
            if (data.code) {
                this.errorFn(data);
            } else {
                data.group_info.avatarUrl = '';
                if (data.group_info.avatar && data.group_info.avatar !== '') {
                    const urlObj = { media_id: data.group_info.avatar };
                    const result: any = await this.apiService.getResource(urlObj);
                    if (!result.code) {
                        data.group_info.avatarUrl = result.url;
                    }
                }
                this.store$.dispatch({
                    type: chatAction.updateGroupInfoEventSuccess,
                    payload: {
                        groupInfo: data.group_info,
                        eventData: info
                    }
                });
            }
            return { type: '[chat] update group info event useless' };
        });
    // 更新用户的信息事件
    @Effect()
    private userInfUpdateEvent$: Observable<Action> = this.actions$
        .ofType(chatAction.userInfUpdateEvent)
        .map(toPayload)
        .switchMap(async (info) => {
            info.name = info.from_username;
            info.type = 3;
            const userObj = {
                username: info.from_username
            };
            const data: any = await this.apiService.getUserInfo(userObj);
            info.avatarUrl = '';
            if (!data.code) {
                info.nickName = data.user_info.nickname;
                info = Object.assign({}, info, data.user_info);
                if (data.user_info.avatar && data.user_info.avatar !== '') {
                    const urlObj = { media_id: data.user_info.avatar };
                    const result: any = await this.apiService.getResource(urlObj);
                    if (!result.code) {
                        info.avatarUrl = result.url;
                    }
                }
            }
            this.store$.dispatch({
                type: chatAction.userInfUpdateEventSuccess,
                payload: info
            });
            return { type: '[chat] user inf update event useless' };
        });
    // 清空会话未读数
    @Effect()
    private emptyUnreadNum$: Observable<Action> = this.actions$
        .ofType(chatAction.emptyUnreadNum)
        .map(toPayload)
        .switchMap(async (unread) => {
            let unreadObj;
            if (unread.type === 3 && unread.name) {
                unreadObj = {
                    username: unread.name
                };
            } else if (unread.type === 4 && unread.key) {
                unreadObj = {
                    gid: unread.key
                };
            }
            if (unreadObj) {
                this.apiService.resetUnreadCount(unreadObj);
            }
            return { type: '[chat] empty unread count useless' };
        });
    // 发送透传消息正在输入
    @Effect()
    private inputMessage$: Observable<Action> = this.actions$
        .ofType(chatAction.inputMessage)
        .map(toPayload)
        .switchMap(async (message) => {
            const msgObj = {
                target_username: message.active.name,
                cmd: JSON.stringify(message.input)
            };
            this.apiService.transSingleMsg(msgObj);
            return { type: '[chat] input message useless' };
        });
    // 添加群组成员禁言
    @Effect()
    private addGroupMemberSilence$: Observable<Action> = this.actions$
        .ofType(chatAction.addGroupMemberSilence)
        .map(toPayload)
        .switchMap(async (info) => {
            const memberObj = {
                gid: info.active.key,
                target_username: info.item.username
            };
            const data: any = await this.apiService.addGroupMemSilence(memberObj);
            if (data.code) {
                const error = {
                    code: -1,
                    myText: '禁言失败'
                };
                this.errorFn(error);
            }
            return { type: '[chat] add group member silence useless' };
        });
    // 删除群组成员禁言
    @Effect()
    private deleteGroupMemberSilence$: Observable<Action> = this.actions$
        .ofType(chatAction.deleteGroupMemberSilence)
        .map(toPayload)
        .switchMap(async (info) => {
            const memberObj = {
                gid: info.active.key,
                target_username: info.item.username
            };
            const data: any = await this.apiService.delGroupMemSilence(memberObj);
            if (data.code) {
                const error = {
                    code: -1,
                    myText: '取消禁言失败'
                };
                this.errorFn(error);
            }
            return { type: '[chat] delete group member silence useless' };
        });
    // 群主或者管理员，收到用户申请入群事件请求头像
    @Effect()
    private receiveGroupInvitationEvent$: Observable<Action> = this.actions$
        .ofType(chatAction.receiveGroupInvitationEvent)
        .map(toPayload)
        .switchMap(async (info) => {
            let promises = [];
            for (let user of info.to_usernames) {
                const urlObj = { media_id: user.avatar };
                const pro = this.apiService.getResource(urlObj).then((urlInfo: any) => {
                    if (urlInfo.code) {
                        user.avatarUrl = '';
                    } else {
                        user.avatarUrl = urlInfo.url;
                    }
                });
                promises.push(pro);
            }
            await Promise.all(promises);
            this.store$.dispatch({
                type: chatAction.receiveGroupInvitationEventSuccess,
                payload: info
            });
            return { type: '[chat] receive group invitation event useless' };
        });
    // 被拒绝入群事件
    @Effect()
    private receiveGroupRefuseEvent$: Observable<Action> = this.actions$
        .ofType(chatAction.receiveGroupRefuseEvent)
        .map(toPayload)
        .switchMap(async (info) => {
            const urlObj = { media_id: info.media_id };
            const urlInfo: any = await this.apiService.getResource(urlObj);
            if (urlInfo.code) {
                info.avatarUrl = '';
            } else {
                info.avatarUrl = urlInfo.url;
            }
            this.store$.dispatch({
                type: chatAction.receiveGroupRefuseEventSuccess,
                payload: info
            });
            return { type: '[chat] receive group refuse event useless' };
        });
    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private router: Router,
        private storageService: StorageService,
        private apiService: ApiService
    ) { }
    private errorFn(error) {
        this.store$.dispatch({
            type: appAction.errorApiTip,
            payload: error
        });
    }
    // 获取未读和已读列表
    private getUnreadListInfo(list, unread) {
        if (unread.avatar && unread.avatar !== '') {
            const urlObj = { media_id: unread.avatar };
            this.apiService.getResource(urlObj).then((result: any) => {
                if (result.code) {
                    unread.avatarUrl = '';
                } else {
                    unread.avatarUrl = result.url;
                }
                this.store$.dispatch({
                    type: chatAction.watchUnreadListSuccess,
                    payload: {
                        info: list.msg_unread_list,
                        loading: false
                    }
                });
            });
        }
    }
    // 接收消息获取media url
    private getMediaUrl(obj, promises?: any[]) {
        if (obj.data.messages[0].content.msg_body.media_id) {
            const urlObj = { media_id: obj.data.messages[0].content.msg_body.media_id };
            const pro1 = this.apiService.getResource(urlObj).then((result: any) => {
                if (result.code) {
                    obj.data.messages[0].content.msg_body.media_url = '';
                } else {
                    obj.data.messages[0].content.msg_body.media_url = result.url;
                }
            });
            if (promises && promises instanceof Array) {
                promises.push(pro1);
            }
        }
    }
    // 名片消息获取资源
    private async getCardResource(content, info, promises?: any[]) {
        if (content.msg_type === 'text' && content.msg_body.extras &&
            content.msg_body.extras.businessCard) {
            const userObj = {
                username: info.data.messages[0].content.msg_body.extras.userName,
                appkey: authPayload.appkey
            };
            const data: any = await this.apiService.getUserInfo(userObj);
            info.data.messages[0].content.msg_body.extras.nickName = data.user_info.nickname;
            if (promises && promises instanceof Array) {
                promises.push(data);
            }
            if (!data.code) {
                const urlObj = { media_id: data.user_info.avatar };
                const urlInfo: any = await this.apiService.getResource(urlObj);
                if (promises && promises instanceof Array) {
                    promises.push(urlInfo);
                }
                if (urlInfo.code) {
                    info.data.messages[0].content.msg_body.extras.media_url = '';
                } else {
                    info.data.messages[0].content.msg_body.extras.media_url = urlInfo.url;
                }
            }
        }
    }
    // 获取新消息的用户头像url
    private async getMsgAvatarUrl(messages, promises) {
        const username = messages.content.from_id !== global.user ?
            messages.content.from_id : messages.content.target_id;
        const userObj = {
            username
        };
        const pro2: any = await this.apiService.getUserInfo(userObj);
        promises.push(pro2);
        if (!pro2.user_info.avatar || pro2.user_info.avatar === '') {
            messages.content.avatarUrl = '';
        } else {
            const urlObj = { media_id: pro2.user_info.avatar };
            const pro3: any = await this.apiService.getResource(urlObj);
            promises.push(pro3);
            if (pro3.code) {
                messages.content.avatarUrl = '';
            } else {
                messages.content.avatarUrl = pro3.url;
            }
        }
    }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { AppStore } from '../../../app.store';
import { roomAction } from '../actions';
import { appAction } from '../../../actions';
import { global, StorageService } from '../../../services/common';

@Injectable()
export class RoomEffect {
    // 获取storage里的voice状态
    @Effect()
    private getVoiceState$: Observable<Action> = this.actions$
        .ofType(roomAction.getRoomVoiceState)
        .map(toPayload)
        .switchMap((key) => {
            let voiceState = this.storageService.get(key);
            if (voiceState) {
                this.store$.dispatch({
                    type: roomAction.getRoomVoiceStateSuccess,
                    payload: JSON.parse(voiceState)
                });
            }
            return Observable.of('getRoomVoiceState')
                    .map(() => {
                        return {type: '[room] get room voice state useless'};
                    });
        });
    // 获取自己已经进入的聊天室列表，并一一退出
    @Effect()
    private getSelfChatrooms$: Observable<Action> = this.actions$
        .ofType(roomAction.getSelfChatrooms)
        .map(toPayload)
        .switchMap((payload) => {
            const getSelfChatrooms = global.JIM.getSelfChatrooms()
            .onSuccess((data) => {
                if (data.chat_rooms.length === 0) {
                    this.store$.dispatch({
                        type: roomAction.exitAllChatroomsSuccess,
                        payload: null
                    });
                    return ;
                }
                let count = 0;
                for (let room of data.chat_rooms) {
                    global.JIM.exitChatroom({
                        id: room.id
                    }).onSuccess((success) => {
                        if (++ count === data.chat_rooms.length) {
                            this.store$.dispatch({
                                type: roomAction.exitAllChatroomsSuccess,
                                payload: null
                            });
                        }
                    }).onFail((error) => {
                        if (++ count === data.chat_rooms.length) {
                            this.store$.dispatch({
                                type: roomAction.exitAllChatroomsSuccess,
                                payload: null
                            });
                        }
                    }).onTimeout(() => {
                        if (++ count === data.chat_rooms.length) {
                            this.store$.dispatch({
                                type: roomAction.exitAllChatroomsSuccess,
                                payload: null
                            });
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
            return Observable.of(getSelfChatrooms)
                    .map(() => {
                        return {type: '[room] show room infomation useless'};
                    });
        });
    // 请求聊天室列表
    @Effect()
    private getRoomList$: Observable<Action> = this.actions$
        .ofType(roomAction.getRoomList)
        .map(toPayload)
        .switchMap((payload) => {
            const getRoomList = global.JIM.getAppkeyChatrooms({
                start: payload.start,
                appkey: payload.appkey
            }).onSuccess((data) => {
                this.store$.dispatch({
                    type: roomAction.getRoomListSuccess,
                    payload: data.result.rooms
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
            return Observable.of(getRoomList)
                    .map(() => {
                        return {type: '[room] get room list useless'};
                    });
        });
    // 切换active聊天室，退出聊天室，请求聊天室详情
    @Effect()
    private changeRoom$: Observable<Action> = this.actions$
        .ofType(roomAction.changeRoom)
        .map(toPayload)
        .switchMap((payload) => {
            this.store$.dispatch({
                type: roomAction.changeRoomSuccess,
                payload: {
                    active: payload,
                    info: {}
                }
            });
            this.exitRoom(payload);
            const changeRoom = global.JIM.getChatroomInfo({
                id: payload.id
            }).onSuccess((data) => {
                this.store$.dispatch({
                    type: roomAction.changeRoomSuccess,
                    payload: {
                        active: payload,
                        info: data.info
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
            return Observable.of(changeRoom)
                    .map(() => {
                        return {type: '[room] change room useless'};
                    });
        });
    // 进入新的聊天室
    @Effect()
    private enterRoom$: Observable<Action> = this.actions$
        .ofType(roomAction.enterRoom)
        .map(toPayload)
        .switchMap((payload) => {
            const enterRoom = global.JIM.enterChatroom({
                id: payload.id
            }).onSuccess((data) => {
                this.store$.dispatch({
                    type: roomAction.enterRoomSuccess,
                    payload
                });
            }).onFail((error) => {
                if (error.code === 881507) {
                    this.store$.dispatch({
                        type: roomAction.enterRoomSuccess,
                        payload
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
            return Observable.of('enterRoom')
                    .map(() => {
                        return {type: '[room] enter room useless'};
                    });
        });
    // 退出聊天室
    @Effect()
    private exitRoom$: Observable<Action> = this.actions$
        .ofType(roomAction.exitRoom)
        .map(toPayload)
        .switchMap((payload) => {
            if (payload.id) {
                this.exitRoom(payload);
            }
            return Observable.of('exitRoom')
                    .map(() => {
                        return {type: '[room] exit room useless'};
                    });
        });
    // 显示聊天室资料
    @Effect()
    private showRoomInfomation$: Observable<Action> = this.actions$
        .ofType(roomAction.showRoomInfomation)
        .map(toPayload)
        .switchMap((payload) => {
            const showRoomInfomation = global.JIM.getChatroomInfo({
                id: payload.id
            }).onSuccess((data) => {
                this.store$.dispatch({
                    type: roomAction.showRoomInfomationSuccess,
                    payload: {
                        show: true,
                        info: data.info
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
            return Observable.of(showRoomInfomation)
                    .map(() => {
                        return {type: '[room] show room infomation useless'};
                    });
        });
    // 收到新消息
    @Effect()
    private receiveMessage$: Observable<Action> = this.actions$
        .ofType(roomAction.receiveMessage)
        .map(toPayload)
        .switchMap((payload) => {
            this.store$.dispatch({
                type: roomAction.receiveMessageSuccess,
                payload: payload.data
            });
            if (payload.data.content.msg_body.media_id) {
                global.JIM.getResource({media_id: payload.data.content.msg_body.media_id})
                .onSuccess((urlInfo) => {
                    payload.data.content.msg_body.media_url = urlInfo.url;
                    this.store$.dispatch({
                        type: roomAction.receiveMessageUrlSuccess,
                        payload: payload.data
                    });
                }).onFail((error) => {
                    // pass
                }).onTimeout((errorInfo) => {
                    // pass
                });
            }
            // 判断是否加载过这个用户的头像，加载过就直接使用本地的用户头像
            let username = payload.data.content.from_id !== global.user ?
                payload.data.content.from_id : payload.data.content.target_id;
            let flag = false;
            for (let message of payload.messageList) {
                let messageUsername = message.content.from_id !== global.user ?
                    message.content.from_id : message.content.target_id;
                if (username === messageUsername &&
                    (message.content.avatarUrl || message.content.avatarUrl === '')) {
                    payload.data.content.avatarUrl = message.content.avatarUrl;
                    flag = true;
                    break;
                }
            }
            if (!flag) {
                global.JIM.getUserInfo({
                    username
                }).onSuccess((user) => {
                    if (user.user_info.avatar !== '') {
                        global.JIM.getResource({media_id: user.user_info.avatar})
                        .onSuccess((urlInfo) => {
                            payload.data.content.avatarUrl = urlInfo.url;
                        }).onFail((error) => {
                            // pass
                        }).onTimeout((errorInfo) => {
                            // pass
                        });
                    }
                }).onFail((error) => {
                    // pass
                }).onTimeout((errorInfo) => {
                    // pass
                });
            }
            return Observable.of('receiveMessage')
                    .map(() => {
                        return {type: '[room] receive message useless'};
                    });
        });
    // 发送文本消息
    @Effect()
    private sendTextMsg$: Observable<Action> = this.actions$
        .ofType(roomAction.sendTextMsg)
        .map(toPayload)
        .switchMap((payload) => {
            const sendTextMsg = global.JIM.sendChatroomMsg(payload.sendMsg)
            .onSuccess((data, msg) => {
                payload.localMsg.success = 2;
                this.store$.dispatch({
                    type: roomAction.sendMsgComplete,
                    payload: {
                        localMsg: payload.localMsg,
                        repeatSend: payload.repeatSend
                    }
                });
            }).onFail((error) => {
                payload.localMsg.success = 3;
                payload.localMsg.sendMsg = payload.sendMsg;
                this.store$.dispatch({
                    type: roomAction.sendMsgComplete,
                    payload: {
                        localMsg: payload.localMsg,
                        repeatSend: payload.repeatSend
                    }
                });
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                payload.localMsg.success = 3;
                payload.localMsg.sendMsg = payload.sendMsg;
                this.store$.dispatch({
                    type: roomAction.sendMsgComplete,
                    payload: {
                        localMsg: payload.localMsg,
                        repeatSend: payload.repeatSend
                    }
                });
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(sendTextMsg)
                    .map(() => {
                        return {type: '[room] send text msg useless'};
                    });
        });
    // 发送文件消息
    @Effect()
    private sendFileMsg$: Observable<Action> = this.actions$
        .ofType(roomAction.sendFileMsg)
        .map(toPayload)
        .switchMap((payload) => {
            const sendFileMsg = global.JIM.sendChatroomFile(payload.sendMsg)
            .onSuccess((data, msg) => {
                payload.localMsg.success = 2;
                this.store$.dispatch({
                    type: roomAction.sendMsgComplete,
                    payload: {
                        localMsg: payload.localMsg,
                        repeatSend: payload.repeatSend
                    }
                });
            }).onFail((error) => {
                payload.localMsg.success = 3;
                payload.localMsg.sendMsg = payload.sendMsg;
                this.store$.dispatch({
                    type: roomAction.sendMsgComplete,
                    payload: {
                        localMsg: payload.localMsg,
                        repeatSend: payload.repeatSend
                    }
                });
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                payload.localMsg.success = 3;
                payload.localMsg.sendMsg = payload.sendMsg;
                this.store$.dispatch({
                    type: roomAction.sendMsgComplete,
                    payload: {
                        localMsg: payload.localMsg,
                        repeatSend: payload.repeatSend
                    }
                });
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(sendFileMsg)
                    .map(() => {
                        return {type: '[room] send file msg useless'};
                    });
        });
    // 发送图片消息
    @Effect()
    private sendPicMsg$: Observable<Action> = this.actions$
        .ofType(roomAction.sendPicMsg)
        .map(toPayload)
        .switchMap((payload) => {
            const sendPicMsg = global.JIM.sendChatroomPic(payload.sendMsg)
            .onSuccess((data, msg) => {
                payload.localMsg.success = 2;
                this.store$.dispatch({
                    type: roomAction.sendMsgComplete,
                    payload: {
                        localMsg: payload.localMsg,
                        repeatSend: payload.repeatSend
                    }
                });
            }).onFail((error) => {
                payload.localMsg.success = 3;
                payload.localMsg.sendMsg = payload.sendMsg;
                this.store$.dispatch({
                    type: roomAction.sendMsgComplete,
                    payload: {
                        localMsg: payload.localMsg,
                        repeatSend: payload.repeatSend
                    }
                });
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                payload.localMsg.success = 3;
                payload.localMsg.sendMsg = payload.sendMsg;
                this.store$.dispatch({
                    type: roomAction.sendMsgComplete,
                    payload: {
                        localMsg: payload.localMsg,
                        repeatSend: payload.repeatSend
                    }
                });
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(sendPicMsg)
                    .map(() => {
                        return {type: '[room] send pic msg useless'};
                    });
        });
    // 发送jpush表情
    @Effect()
    private transmitPicMsg$: Observable<Action> = this.actions$
        .ofType(roomAction.transmitPicMsg)
        .map(toPayload)
        .switchMap((payload) => {
            const transmitPicMsg = global.JIM.sendChatroomPic(payload.sendMsg)
            .onSuccess((data, msg) => {
                payload.localMsg.success = 2;
                this.store$.dispatch({
                    type: roomAction.sendMsgComplete,
                    payload: {
                        localMsg: payload.localMsg,
                        repeatSend: payload.repeatSend
                    }
                });
            }).onFail((error) => {
                payload.localMsg.success = 3;
                payload.localMsg.sendMsg = payload.sendMsg;
                this.store$.dispatch({
                    type: roomAction.sendMsgComplete,
                    payload: {
                        localMsg: payload.localMsg,
                        repeatSend: payload.repeatSend
                    }
                });
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            }).onTimeout((data) => {
                payload.localMsg.success = 3;
                payload.localMsg.sendMsg = payload.sendMsg;
                this.store$.dispatch({
                    type: roomAction.sendMsgComplete,
                    payload: {
                        localMsg: payload.localMsg,
                        repeatSend: payload.repeatSend
                    }
                });
                const error = {code: 910000};
                this.store$.dispatch({
                    type: appAction.errorApiTip,
                    payload: error
                });
            });
            return Observable.of(transmitPicMsg)
                    .map(() => {
                        return {type: '[room] transmit pic msg useless'};
                    });
        });
    constructor(
        private actions$: Actions,
        private store$: Store<AppStore>,
        private storageService: StorageService
    ) {
        // pass
    }
    private exitRoom(payload) {
        global.JIM.exitChatroom({
            id: payload.id
        }).onSuccess((data) => {
            this.store$.dispatch({
                type: roomAction.exitRoomSuccess,
                payload: null
            });
        }).onFail((data) => {
            // pass
        }).onTimeout(() => {
            // pass
        });
    }
};

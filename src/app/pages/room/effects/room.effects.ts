import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { AppStore } from '../../../app.store';
import { roomAction } from '../actions';
import { appAction } from '../../../actions';
import { global } from '../../../services/common/global';

@Injectable()
export class RoomEffect {
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
    // 请求单个聊天室的详情
    @Effect()
    private changeRoom$: Observable<Action> = this.actions$
        .ofType(roomAction.changeRoom)
        .map(toPayload)
        .switchMap((payload) => {
            const changeRoom = global.JIM.getChatroomInfo({
                id: payload.id
            }).onSuccess((data) => {
                console.log(4444, data);
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
    // 退出前一个聊天室进入新的聊天室
    @Effect()
    private enterRoom$: Observable<Action> = this.actions$
        .ofType(roomAction.enterRoom)
        .map(toPayload)
        .switchMap((payload) => {
            if (payload.old.id) {
                global.JIM.exitChatroom({
                    id: payload.old.id
                }).onSuccess((data) => {
                    this.enterRoom(payload.new);
                }).onFail((data) => {
                    // pass
                }).onTimeout(() => {
                    // pass
                });
            } else {
                this.enterRoom(payload.new);
            }
            return Observable.of('enterRoom')
                    .map(() => {
                        return {type: '[room] enter room useless'};
                    });
        });
    // 退出前一个聊天室进入新的聊天室
    @Effect()
    private exitRoom$: Observable<Action> = this.actions$
        .ofType(roomAction.exitRoom)
        .map(toPayload)
        .switchMap((payload) => {
            if (payload.id) {
                global.JIM.exitChatroom({
                    id: payload.id
                }).onSuccess((data) => {
                    // pass
                }).onFail((data) => {
                    // pass
                }).onTimeout(() => {
                    // pass
                });
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
                payload
            });
            if (payload.content.msg_body.media_id) {
                global.JIM.getResource({media_id: payload.content.msg_body.media_id})
                .onSuccess((urlInfo) => {
                    payload.content.msg_body.media_url = urlInfo.url;
                }).onFail((error) => {
                    // pass
                }).onTimeout((errorInfo) => {
                    // pass
                });
            }
            let username = payload.content.from_id !== global.user ?
                payload.content.from_id : payload.content.target_id;
            global.JIM.getUserInfo({
                username
            }).onSuccess((user) => {
                if (user.user_info.avatar !== '') {
                    global.JIM.getResource({media_id: user.user_info.avatar})
                    .onSuccess((urlInfo) => {
                        payload.content.avatarUrl = urlInfo.url;
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
        private store$: Store<AppStore>
    ) {
        // pass
    }
    private enterRoom(payload) {
        const enterRoom = global.JIM.enterChatroom({
            id: payload.id
        }).onSuccess((data) => {
            this.store$.dispatch({
                type: roomAction.enterRoomSuccess,
                payload
            });
        }).onFail((error) => {
            console.log(error);
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
    }
};

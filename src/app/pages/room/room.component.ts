import { Component, OnInit, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { global, authPayload } from '../../services/common';
import { roomAction } from './actions';
import { mainAction } from '../main/actions';
import { Util } from '../../services/util';
import { chatAction } from '../chat/actions';
const PageSize = 20;

@Component({
    selector: 'room-component',
    templateUrl: './room.component.html',
    styleUrls: ['./room.component.scss']
})

export class RoomComponent implements OnInit {
    private roomList = [];
    private active: any = {};
    private roomDetail = {};
    private showPanel = 0;
    private enter: any = {};
    private roomInfomation = {
        show: false,
        info: {}
    };
    private messageList = [];
    private msgKey = 0;
    private selfInfo: any = {};
    private scrollToBottom = false;
    private otherScrollTobottom = false;
    private start = 0;
    private loadMoreRoomsFlag = false;
    private rememberEnter = null;
    constructor(
        private store$: Store<any>,
        private elementRef: ElementRef
    ) {
        // pass
    }
    public ngOnInit() {
        this.store$.dispatch({
            type: roomAction.getRoomList,
            payload: {
                start: this.start,
                appkey: authPayload.appKey
            }
        });
        this.store$.dispatch({
            type: roomAction.getRoomVoiceState,
            payload: `voiceRoomState-${authPayload.appKey}-${global.user}`
        });
        this.store$.dispatch({
            type: roomAction.getSelfChatrooms,
            payload: null
        });
        this.store$.select((state) => {
            const roomState = state['roomReducer'];
            const mainState = state['mainReducer'];
            this.stateChanged(roomState, mainState);
            return state;
        }).subscribe((state) => {
            // pass
        });
    }
    private stateChanged(roomState, mainState) {
        console.log(5555, roomState);
        switch (roomState.actionType) {
            case mainAction.showSelfInfo:
                if (mainState.selfInfo.info) {
                    this.selfInfo = mainState.selfInfo.info;
                }
                break;
            case roomAction.exitAllChatroomsSuccess:
                global.JIM.onRoomMsg((data) => {
                    this.store$.dispatch({
                        type: roomAction.receiveMessage,
                        payload: {
                            data,
                            messageList: this.messageList
                        }
                    });
                });
                break;
            case roomAction.getRoomListSuccess:
                this.roomList = roomState.roomList;
                this.loadMoreRoomsFlag = !this.loadMoreRoomsFlag;
                break;
            case roomAction.changeRoomSuccess:

            case mainAction.selectSearchRoomUser:
                this.active = roomState.active;
                this.roomDetail = roomState.roomDetail;
                this.showPanel = 1;
                this.rememberEnter = null;
                break;
            case roomAction.enterRoomSuccess:
                if (this.active.id === roomState.enter.id) {
                    this.showPanel = 2;
                    this.rememberEnter = this.enter = roomState.enter;
                    this.scrollToBottom = !this.scrollToBottom;
                }
                this.messageList = roomState.messageList;
                break;
            case roomAction.showRoomInfomationSuccess:
                this.roomInfomation = roomState.roomInfomation;
                break;
            case roomAction.receiveMessageSuccess:
                this.messageList = roomState.messageList;
                this.otherScrollTobottom = !this.otherScrollTobottom;
                break;
            case roomAction.sendTextMsg:

            case roomAction.sendFileMsg:

            case roomAction.sendPicMsg:

            case roomAction.transmitPicMsg:
                this.otherScrollTobottom = !this.otherScrollTobottom;
                break;
            case roomAction.exitRoomSuccess:
                this.enter = roomState.enter;
                break;
            case mainAction.changeListTab:
                if (mainState.listTab === 2 && this.rememberEnter) {
                    this.store$.dispatch({
                        type: roomAction.enterRoom,
                        payload: this.rememberEnter
                    });
                }
            case mainAction.createGroup:

            case mainAction.selectSearchUser:

            case chatAction.createOtherChat:
                if (mainState.listTab !== 2 && this.enter.id) {
                    this.store$.dispatch({
                        type: roomAction.exitRoom,
                        payload: this.enter
                    });
                }
                break;
            default:
        }
    }
    private loadMoreRoomsEmit() {
        this.start += PageSize;
        this.store$.dispatch({
            type: roomAction.getRoomList,
            payload: {
                start: this.start,
                appkey: authPayload.appKey
            }
        });
    }
    private changeRoomEmit(room) {
        if (this.active.id !== room.id) {
            this.store$.dispatch({
                type: roomAction.changeRoom,
                payload: room
            });
        }
    }
    private enterRoomEmit(room) {
        this.store$.dispatch({
            type: roomAction.enterRoom,
            payload: room
        });
    }
    private showRoomInfomationEmit() {
        this.store$.dispatch({
            type: roomAction.showRoomInfomation,
            payload: this.enter
        });
    }
    private hideRoomInfomationEmit() {
        this.store$.dispatch({
            type: roomAction.showRoomInfomationSuccess,
            payload: {
                show: false,
                info: {}
            }
        });
    }
    private sendMsgEmit(data) {
        /**
         * success
         * 取值 状态
         * 1  正在发送
         * 2  发送成功
         * 3  发送失败
         */
        if (data.repeatSend) {
            this.store$.dispatch({
                type: roomAction.sendTextMsg,
                payload: {
                    localMsg: data.repeatSend.localMsg,
                    sendMsg: data.repeatSend.localMsg.sendMsg,
                    repeatSend: true
                }
            });
        } else {
            let localMsg: any = {
                content: {
                    msg_type: 'text',
                    from_id: global.user,
                    from_name: this.selfInfo.nickname,
                    msg_body: {
                        text: data.content
                    }
                },
                ctime_ms: new Date().getTime(),
                success: 1,
                msgKey: this.msgKey ++
            };
            let sendMsg: any = {
                target_rid: this.enter.id,
                content: data.content
            };
            if (data.type === 'businessCard') {
                localMsg.content.msg_body.extras = data.localExtras;
                sendMsg.extras = data.extras;
            }
            this.store$.dispatch({
                type: roomAction.sendTextMsg,
                payload: {
                    localMsg,
                    sendMsg,
                    repeatSend: false
                }
            });
        }
    }
    private sendFileEmit(data) {
        if (data.repeatSend) {
            this.store$.dispatch({
                type: roomAction.sendFileMsg,
                payload: {
                    localMsg: data.repeatSend.localMsg,
                    sendMsg: data.repeatSend.localMsg.sendMsg,
                    repeatSend: true
                }
            });
        } else {
            const ext = Util.getExt(data.fileData.name);
            let localMsg  = {
                content: {
                    msg_type: 'file',
                    from_id: global.user,
                    from_name: this.selfInfo.nickname,
                    msg_body: {
                        fname: data.fileData.name,
                        fsize: data.fileData.size,
                        extras: {
                            fileSize: data.fileData.size,
                            fileType: ext
                        }
                    }
                },
                ctime_ms: new Date().getTime(),
                success: 1,
                msgKey: this.msgKey ++
            };
            let sendMsg = {
                target_rid: this.enter.id,
                file: data.file,
                extras: {
                    fileSize: data.fileData.size,
                    fileType: ext
                }
            };
            this.store$.dispatch({
                type: roomAction.sendFileMsg,
                payload: {
                    localMsg,
                    sendMsg,
                    repeatSend: false
                }
            });
        }
    }
    private sendPicEmit(data) {
        if (data.repeatSend) {
            this.store$.dispatch({
                type: roomAction.sendPicMsg,
                payload: {
                    localMsg: data.repeatSend.localMsg,
                    sendMsg: data.repeatSend.localMsg.sendMsg,
                    repeatSend: true
                }
            });
        } else {
            if (data.type === 'paste') {
                this.sendPicContent(data.info, data);
            } else if (data.type === 'jpushEmoji') {
                let localMsg = {
                    content: {
                        from_id: global.user,
                        from_name: this.selfInfo.nickname,
                        msg_type: 'image',
                        msg_body: data.jpushEmoji.body
                    },
                    ctime_ms: new Date().getTime(),
                    success: 1,
                    msgKey: this.msgKey ++
                };
                let sendMsg = {
                    target_rid: this.enter.id,
                    msg_body: {
                        format: data.jpushEmoji.body.format,
                        fsize: data.jpushEmoji.body.fsize,
                        height: data.jpushEmoji.body.height,
                        media_crc32: data.jpushEmoji.body.media_crc32,
                        media_id: data.jpushEmoji.body.media_id,
                        width: data.jpushEmoji.body.width,
                        extras: {
                            kLargeEmoticon: 'kLargeEmoticon'
                        }
                    }
                };
                this.store$.dispatch({
                    type: roomAction.transmitPicMsg,
                    payload: {
                        localMsg,
                        sendMsg,
                        repeatSend: false
                    }
                });
            } else if (data.type === 'img') {
                const file = this.elementRef.nativeElement.querySelector('#sendPic2');
                Util.imgReader(file, () => {
                    this.store$.dispatch({
                        type: mainAction.showModalTip,
                        payload: {
                            show: true,
                            info: {
                                title: '提示',
                                tip: '选择的文件必须是图片',
                                actionType: '[chat] must be image',
                                cancel: true
                            }
                        }
                    });
                }, (value) => {
                    this.sendPicContent(value, data);
                });
            }
        }
    }
    private sendPicContent(value, data) {
        let localMsg: any = {
            content: {
                from_id: global.user,
                from_name: this.selfInfo.nickname,
                msg_type: 'image',
                msg_body: {
                    media_url: value.src,
                    width: value.width,
                    height: value.height
                }
            },
            ctime_ms: new Date().getTime(),
            success: 1,
            msgKey: this.msgKey ++
        };
        let sendMsg = {
            target_rid: this.enter.id,
            image: data.img,
            repeatSend: false
        };
        this.store$.dispatch({
            type: roomAction.sendPicMsg,
            payload: {
                localMsg,
                sendMsg,
                repeatSend: false
            }
        });
    }
    private msgTransmitEmit(item) {
        this.store$.dispatch({
            type: roomAction.transmitAllMsg,
            payload: item
        });
    }
    // 查看个人信息
    private watchSelfInfoEmit() {
        this.store$.dispatch({
            type: mainAction.showSelfInfo,
            payload: {
                show: true
            }
        });
    }
    // 查看用户信息
    private watchOtherInfoEmit(info) {
        this.store$.dispatch({
            type: chatAction.watchOtherInfo,
            payload: info
        });
    }
    // 消息面板发送名片
    private businessCardSendEmit(user) {
        let msg = {
            content: '推荐了一张名片',
            extras: {
                userName: user.name,
                appKey: user.appkey,
                businessCard: 'businessCard'
            },
            localExtras: {
                userName: user.name,
                appKey: user.appkey,
                businessCard: 'businessCard',
                media_url: user.avatarUrl,
                nickName: user.nickName
            },
            type: 'businessCard'
        };
        this.sendMsgEmit(msg);
    }
    // 显示视频模态框
    private playVideoEmit(url) {
        this.store$.dispatch({
            type: chatAction.playVideoShow,
            payload: {
                url,
                show: true
            }
        });
    }
}

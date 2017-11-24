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
    private enterRoomLoading = false;
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
    private noMoreRooms = false;
    constructor(
        private store$: Store<any>,
        private elementRef: ElementRef
    ) {}
    public ngOnInit() {
        this.store$.dispatch({
            type: roomAction.init,
            payload: null
        });
        // 获取聊天室第一页的列表
        this.store$.dispatch({
            type: roomAction.getRoomList,
            payload: {
                start: this.start,
                appkey: authPayload.appKey
            }
        });
        // 获取本地存储的语音已读状态
        this.store$.dispatch({
            type: roomAction.getRoomVoiceState,
            payload: `voiceRoomState-${authPayload.appKey}-${global.user}`
        });
        // 获取自己目前所在的群聊列表
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
        console.log('roomState', roomState);
        switch (roomState.actionType) {
            case roomAction.init:
                this.init();
                break;
            case mainAction.showSelfInfo:
                if (mainState.selfInfo.info) {
                    this.selfInfo = mainState.selfInfo.info;
                }
                break;
            case roomAction.exitAllChatroomsSuccess:
                this.watchRoomMsg();
                break;
            case roomAction.getRoomListSuccess:
                this.roomList = roomState.roomList;
                this.loadMoreRoomsFlag = !this.loadMoreRoomsFlag;
                this.noMoreRooms = roomState.noMoreRooms;
                break;
            case roomAction.changeRoomSuccess:
                this.active = roomState.active;
                this.roomDetail = roomState.roomDetail;
                this.rememberEnter = null;
                this.store$.dispatch({
                    type: roomAction.showPanel,
                    payload: 1
                });
                break;
            case mainAction.selectSearchRoomUser:
                this.active = roomState.active;
                this.roomDetail = roomState.roomDetail;
                this.rememberEnter = null;
                this.showPanel = roomState.showPanel;
                break;
            case roomAction.enterRoom:
                this.enterRoomLoading = roomState.enterRoomLoading;
                break;
            case roomAction.enterRoomError:
                this.enterRoomLoading = roomState.enterRoomLoading;
                break;
            case roomAction.enterRoomSuccess:
                if (this.active.id === roomState.enter.id) {
                    this.store$.dispatch({
                        type: roomAction.showPanel,
                        payload: 2
                    });
                    this.rememberEnter = this.enter = roomState.enter;
                    this.scrollToBottom = !this.scrollToBottom;
                }
                this.messageList = roomState.messageList;
                this.enterRoomLoading = roomState.enterRoomLoading;
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
            case roomAction.showPanel:
                this.showPanel = roomState.showPanel;
                break;
            default:
        }
    }
    private init() {
        this.roomList = [];
        this.active = {};
        this.roomDetail = {};
        this.enterRoomLoading = false;
        this.showPanel = 0;
        this.enter = {};
        this.roomInfomation = {
            show: false,
            info: {}
        };
        this.messageList = [];
        this.msgKey = 0;
        this.selfInfo = {};
        this.scrollToBottom = false;
        this.otherScrollTobottom = false;
        this.start = 0;
        this.loadMoreRoomsFlag = false;
        this.rememberEnter = null;
    }
    // 监听聊天室消息
    private watchRoomMsg() {
        global.JIM.onRoomMsg((data) => {
            this.store$.dispatch({
                type: roomAction.receiveMessage,
                payload: {
                    data,
                    messageList: this.messageList
                }
            });
        });
    }
    // 加载更多聊天室
    private loadMoreRoomsEmit() {
        if (!this.noMoreRooms) {
            this.start += PageSize;
            this.store$.dispatch({
                type: roomAction.getRoomList,
                payload: {
                    start: this.start,
                    appkey: authPayload.appKey
                }
            });
        }
    }
    // 切换聊天室
    private changeRoomEmit(room) {
        if (this.active.id !== room.id) {
            this.store$.dispatch({
                type: roomAction.changeRoom,
                payload: room
            });
        }
    }
    // 进入聊天室
    private enterRoomEmit(room) {
        this.store$.dispatch({
            type: roomAction.enterRoom,
            payload: room
        });
    }
    // 显示聊天室信息
    private showRoomInfomationEmit() {
        this.store$.dispatch({
            type: roomAction.showRoomInfomation,
            payload: this.enter
        });
    }
    // 隐藏聊天室信息
    private hideRoomInfomationEmit() {
        this.store$.dispatch({
            type: roomAction.showRoomInfomationSuccess,
            payload: {
                show: false,
                info: {}
            }
        });
    }
    // 发送文本
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
    // 发送文件
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
            const localMsg  = {
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
            const sendMsg = {
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
    // 发送图片
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
                const localMsg = {
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
                const sendMsg = {
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
        const localMsg = {
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
        const sendMsg = {
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
    // 消息转发
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
        const msg = {
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

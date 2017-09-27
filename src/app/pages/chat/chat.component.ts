import { Component, OnInit, ElementRef, HostListener, OnDestroy, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs/Subject';
import { global, authPayload, StorageService } from '../../services/common';
import { AppStore } from '../../app.store';
import { chatAction } from './actions';
import { mainAction } from '../main/actions';
import { Util } from '../../services/util';
import { contactAction } from '../contact/actions';
import * as Push from 'push.js';

@Component({
    selector: 'chat-component',
    styleUrls: ['./chat.component.scss'],
    templateUrl: './chat.component.html'
})
export class ChatComponent implements OnInit, OnDestroy {
    @Input()
        private hideAll;
    private isLoadedSubject = new Subject();
    private isLoaded$ = this.isLoadedSubject.asObservable();
    private isLoaded = false;
    private util: Util = new Util();
    private chatStream$;
    private conversationList = [];
    private messageList = [
        {
            key: 0,
            msgs: [],
            groupSetting: {
                groupInfo: {},
                memberList: []
            }
        }
    ];
    private global = global;
    private active = {
        // 当前active的用户
        name: '',
        nickName: '',
        key: '',
        activeIndex: -1,
        type: 0,
        change: false,
        shield: false,
        appkey: ''
    };
    private defaultPanelIsShow = true;
    private otherInfo = {
        show: false,
        info: {
            name: '',
            appkey: '',
            avatarUrl: '',
            nickName: ''
        }
    };
    private blackMenu = {
        show: false,
        menu: []
    };
    private groupSetting = {
        groupInfo: {
            name: '',
            desc: '',
            gid: 0
        },
        memberList: [],
        active: {},
        show: false
    };
    private msgKey = 1;
    private groupDescription = {
        show: false,
        description: {}
    };
    private selfInfo: any = {};
    private isCacheArr = [];
    private storageKey;
    private playVideoShow = {
        show: false,
        url: ''
    };
    private eventArr = [];
    private hasOffline = 0;
    // 其他操作触发滚动条到底部
    private otherOptionScrollBottom = false;
    // 切换用户触发滚动条到底部
    private changeActiveScrollBottom = false;
    private windowIsFocus = true;
    private newMessageNotice = {
        timer: null,
        num: 0
    };
    private messageTransmit = {
        list: [],
        show: false,
        type: ''
    };
    private transmitItem = {
        content: {
            msg_type: '',
            from_id: '',
            target_id: ''
        },
        msgKey: -1,
        totalTransmitNum: 0,
        ctime_ms: 0,
        conversation_time_show: '',
        time_show: '',
        hasLoad: false,
        showMoreIcon: false,
        type: 0,
        key: 0,
        isTransmitMsg: true,
        msg_id: 0,
        unread_count: 0,
        msg_type: 0,
        success: 1
    };
    private verifyModal = {
        info: {},
        show: false
    };
    private changeOtherInfoFlag = false;
    private sendBusinessCardCount = 0;
    private groupAvatar = {
        info: {
            src: '',
            width: 0,
            height: 0,
            pasteFile: {}
        },
        show: false,
        formData: {},
        src: ''
    };
    private unreadList = {
        show: false,
        info: {
            read: [],
            unread: []
        },
        loading: false
    };
    private isMySelf = false;
    // private asyncConversationCount = 0;
    constructor(
        private store$: Store<AppStore>,
        private storageService: StorageService,
        private elementRef: ElementRef
    ) {
        // pass
    }
    public ngOnInit() {
        this.store$.dispatch({
            type: chatAction.init,
            payload: null
        });
        this.hasOffline = 0;
        this.subscribeStore();
        this.store$.dispatch({
            type: chatAction.getVoiceState,
            payload: `voiceState-${authPayload.appKey}-${global.user}`
        });
        this.store$.dispatch({
            type: chatAction.getFriendList,
            payload: null
        });
        global.JIM.onMsgReceive((data) => {
            console.log(data);
            // 与feedback_的消息不做处理
            let feedbackReg = /^feedback_/g;
            if (data.messages[0].content.target_id.match(feedbackReg)) {
                return ;
            }
            if (data.messages[0].content.from_id === global.user) {
                this.isMySelf = true;
                this.store$.dispatch({
                    type: chatAction.syncReceiveMessage,
                    payload: {
                        data
                    }
                });
                return ;
            } else {
                this.isMySelf = false;
            }
            // 群聊消息
            if (data.messages[0].msg_type === 4) {
                this.store$.dispatch({
                    type: chatAction.receiveGroupMessage,
                    payload: {
                        data,
                        conversation: this.conversationList,
                        messageList: this.messageList
                    }
                });
            // 单聊消息
            } else {
                this.store$.dispatch({
                    type: chatAction.receiveSingleMessage,
                    payload: {
                        data,
                        conversation: this.conversationList
                    }
                });
            }
        });
        // 异常断线监听
        global.JIM.onDisconnect(() => {
            // 定时器是为了解决火狐下刷新时先弹出断线提示
            setTimeout(() => {
                this.store$.dispatch({
                    type: mainAction.logoutKickShow,
                    payload: {
                        show: true,
                        info: {
                            title: '提示',
                            tip: '网络断线，请检查网络或重新登陆'
                        }
                    }
                });
            }, 2000);
        });
        // 监听在线事件消息
        global.JIM.onEventNotification((data) => {
            console.log('event', data);
            data.isOffline = false;
            this.asyncEvent(data);
        });
        // 监听离线事件消息
        global.JIM.onSyncEvent((data) => {
            console.log('asyncEvent', data);
            if (!this.isLoaded) {
                this.eventArr = data;
            } else {
                for (let item of data) {
                    item.isOffline = true;
                    this.asyncEvent(item);
                }
            }
        });
        // 离线业务消息监听，加载完会话数据之后才执行
        this.isLoaded$.subscribe((isLoaded) => {
            if (isLoaded) {
                for (let item of this.eventArr) {
                    item.isOffline = true;
                    this.asyncEvent(item);
                }
                this.eventArr = [];
            }
        });
        // 离线消息同步监听
        global.JIM.onSyncConversation((data) => {
            console.log('离线消息1', data, JSON.stringify(data));
            // 限制只触发一次
            if (this.hasOffline === 0) {
                this.hasOffline ++;
                this.store$.dispatch({
                    type: chatAction.getAllMessage,
                    payload: data
                });
            }
        });
        // 如果3秒内没有加载离线消息则手动触发
        setTimeout(() => {
            console.log('setTimeout', this.hasOffline);
            if (this.hasOffline === 0) {
                this.store$.dispatch({
                    type: chatAction.getAllMessage,
                    payload: []
                });
            }
        }, 3000);
        global.JIM.onMsgReceiptChange((data) => {
            console.log('onMsgReceiptChange', data);
            this.store$.dispatch({
                type: chatAction.msgReceiptChangeEvent,
                payload: data
            });
        });
        global.JIM.onUserInfUpdate((data) => {
            console.log('onUserInfUpdate', data);
            this.store$.dispatch({
                type: chatAction.userInfUpdateEvent,
                payload: data
            });
        });
    }
    public ngOnDestroy() {
        this.chatStream$.unsubscribe();
        this.isLoadedSubject.unsubscribe();
    }
    @HostListener('window:blur') private onBlurWindow() {
        this.windowIsFocus = false;
    }
    @HostListener('window:focus') private onFocusWindow() {
        this.windowIsFocus = true;
        this.newMessageNotice.num = 0;
    }
    // 切换标签页事件
    @HostListener('document:visibilitychange') private onChangeWindow() {
        const hiddenProperty = 'hidden' in document ? 'hidden' :
                            'webkitHidden' in document ? 'webkitHidden' :
                            'mozHidden' in document ? 'mozHidden' : null;
        if (!document[hiddenProperty]) {
            this.windowIsFocus = true;
            this.newMessageNotice.num = 0;
        } else {
            this.windowIsFocus = false;
        }
    }
    private subscribeStore() {
        this.chatStream$ = this.store$.select((state) => {
            const chatState = state['chatReducer'];
            const mainState = state['mainReducer'];
            this.stateChanged(chatState, mainState);
            return state;
        }).subscribe((state) => {
            // pass
        });
    }
    private stateChanged(chatState, mainState) {
        let activeIndex = chatState.activePerson.activeIndex;
        let messageListActive = chatState.messageList[activeIndex];
        console.log(chatState.actionType, 'chat', chatState);
        switch (chatState.actionType) {
            case chatAction.init:
                this.init();
                break;
            case chatAction.getFriendListSuccess:
                this.conversationList = chatState.conversation;
                this.store$.dispatch({
                    type: chatAction.dispatchFriendList,
                    payload: chatState.friendList
                });
                break;
            case chatAction.getConversationSuccess:
                this.conversationList = chatState.conversation;
                this.messageList = chatState.messageList;
                // 如果是第一次登陆且有离线消息则存储当前msgId
                this.storageKey = `msgId-${authPayload.appKey}-${global.user}`;
                if (chatState.msgId.length > 0 && !this.storageService.get(this.storageKey)) {
                    this.storageMsgId(chatState.msgId);
                }
                if (chatState.isLoaded) {
                    this.isLoaded = chatState.isLoaded;
                    this.isLoadedSubject.next(this.isLoaded);
                }
                break;
            case chatAction.receiveMessageSuccess:
                if (chatState.newMessageIsActive) {
                    if (chatState.msgId.length > 0) {
                        this.storageMsgId(chatState.msgId);
                    }
                    this.otherOptionScrollBottom = !this.otherOptionScrollBottom;
                }
                this.messageList = chatState.messageList;
                if (!chatState.newMessageIsDisturb && !this.isMySelf) {
                    this.notification(chatState.newMessage);
                    this.store$.dispatch({
                        type: chatAction.dispatchMessageUnread,
                        payload: null
                    });
                }
                break;
            case chatAction.sendSingleMessage:

            case chatAction.sendGroupMessage:

            case chatAction.sendSinglePic:

            case chatAction.sendGroupPic:

            case chatAction.sendSingleFile:

            case chatAction.sendGroupFile:
                // 触发滚动条向下滚动
                this.otherOptionScrollBottom = !this.otherOptionScrollBottom;
                break;
            case chatAction.updateGroupInfoEventSuccess:
                if (activeIndex >= 0 && messageListActive && messageListActive.groupSetting) {
                    this.groupSetting = Object.assign({},
                        this.groupSetting, messageListActive.groupSetting);
                    this.groupSetting.active = this.active;
                }
                this.store$.dispatch({
                    type: chatAction.updateContactInfo,
                    payload: {
                        groupList: chatState.groupList
                    }
                });
                // 触发滚动条向下滚动
                if (chatState.newMessageIsActive) {
                    this.otherOptionScrollBottom = !this.otherOptionScrollBottom;
                }
                break;
            case chatAction.sendMsgComplete:
                if (chatState.msgId.length > 0) {
                    this.storageMsgId(chatState.msgId);
                }
                this.modalTipSendCardSuccess(chatState);
                break;
            case chatAction.changeActivePerson:

            case contactAction.selectContactItem:

            case mainAction.selectSearchUser:
                this.messageList = chatState.messageList;
                this.changeActivePerson(chatState);
                this.defaultPanelIsShow = chatState.defaultPanelIsShow;
                this.storageMsgId(chatState.msgId);
                break;
            case chatAction.addReceiptReportAction:
                if (chatState.readObj && chatState.readObj.msg_id.length > 0) {
                    this.store$.dispatch({
                        type: chatAction.addReceiptReport,
                        payload: chatState.readObj
                    });
                }
                break;
            case chatAction.saveDraft:
                this.messageList = chatState.messageList;
                this.conversationList = chatState.conversation;
                break;
            case mainAction.searchUser:
                this.store$.dispatch({
                    type: chatAction.searchUserSuccess,
                    payload: chatState.searchUserResult
                });
                break;
            case chatAction.deleteConversationItem:
                this.defaultPanelIsShow = chatState.defaultPanelIsShow;
                // this.groupSetting.show = false;
                this.closeGroupSettingEmit();
                this.store$.dispatch({
                    type: chatAction.dispatchFriendList,
                    payload: chatState.friendList
                });
                this.active = chatState.activePerson;
                break;
            case chatAction.watchOtherInfoSuccess:

            case chatAction.hideOtherInfo:

            case  mainAction.createSingleChatSuccess:

            case contactAction.watchVerifyUserSuccess:
                this.otherInfo = chatState.otherInfo;
                break;
            case chatAction.groupSetting:
                if (activeIndex < 0) {
                    this.groupSetting.show = false;
                }
            case chatAction.groupInfo:
                if (activeIndex >= 0 && messageListActive && messageListActive.groupSetting) {
                    this.groupSetting = Object.assign({},
                        this.groupSetting, messageListActive.groupSetting);
                    this.groupSetting.active = this.active;
                }
                break;
            case mainAction.createGroupSuccess:
                this.messageList = chatState.messageList;
                this.changeActivePerson(chatState);
                this.defaultPanelIsShow = chatState.defaultPanelIsShow;
                break;
            case chatAction.createOtherChat:
                this.messageList = chatState.messageList;
                this.changeActivePerson(chatState);
                this.defaultPanelIsShow = chatState.defaultPanelIsShow;
                if (chatState.msgId.length > 0) {
                    this.storageMsgId(chatState.msgId);
                }
                this.unreadList.show = false;
                // this.groupSetting.show = false;
                this.closeGroupSettingEmit();
                break;
            case mainAction.exitGroupSuccess:
                this.conversationList = chatState.conversation;
                this.defaultPanelIsShow = chatState.defaultPanelIsShow;
                // this.groupSetting.show = false;
                this.closeGroupSettingEmit();
                this.active = chatState.activePerson;
                break;
            case mainAction.addBlackListSuccess:
                this.conversationList = chatState.conversation;
                this.otherInfo = chatState.otherInfo;
                this.changeOtherInfoFlag = !this.changeOtherInfoFlag;
                break;
            case chatAction.groupDescription:
                this.groupDescription.show = chatState.groupDeacriptionShow;
                this.groupDescription.description = Object.assign({},
                    messageListActive.groupSetting.groupInfo, {});
                break;
            // case chatAction.groupName:
            //     this.groupSetting.groupInfo.name = messageListActive.groupSetting.groupInfo.name;
            //     this.store$.dispatch({
            //         type: chatAction.updateContactInfo,
            //         payload: {
            //             groupList: chatState.groupList
            //         }
            //     });
                // break;
            case mainAction.showSelfInfo:
                if (mainState.selfInfo.info) {
                    this.selfInfo = mainState.selfInfo.info;
                }
                break;
            case mainAction.addGroupMemberSuccess:
                this.groupSetting.memberList = messageListActive.groupSetting.memberList;
                break;
            case chatAction.changeGroupShieldSuccess:
                this.conversationList = chatState.conversation;
                this.active.shield = chatState.activePerson.shield;
                break;
            case chatAction.playVideoShow:
                this.playVideoShow = chatState.playVideoShow;
                break;
            // 群聊事件
            case chatAction.addGroupMembersEventSuccess:
                if (activeIndex >= 0 && messageListActive && messageListActive.groupSetting) {
                    this.groupSetting = Object.assign({},
                        this.groupSetting, messageListActive.groupSetting);
                }
                if (chatState.currentIsActive) {
                    this.otherOptionScrollBottom = !this.otherOptionScrollBottom;
                }
                break;
            case chatAction.updateGroupMembersEvent:

            case chatAction.deleteGroupMembersEvent:

            case chatAction.exitGroupEvent:
                if (activeIndex >= 0 && messageListActive && messageListActive.groupSetting) {
                    this.groupSetting = Object.assign({},
                        this.groupSetting, messageListActive.groupSetting);
                }
                if (chatState.currentIsActive) {
                    this.otherOptionScrollBottom = !this.otherOptionScrollBottom;
                }
                break;
            case chatAction.createGroupSuccessEvent:
                this.conversationList = chatState.conversation;
                break;
            case chatAction.msgRetractEvent:
                this.conversationList = chatState.conversation;
                this.messageList = chatState.messageList;
                if (chatState.msgId.length > 0) {
                    this.storageMsgId(chatState.msgId);
                }
                break;
                // 转发单聊文本消息
            case chatAction.transmitSingleMessage:

                // 转发单聊图片消息
            case chatAction.transmitSinglePic:

                // 转发单聊文件消息
            case chatAction.transmitSingleFile:

                // 转发群聊文本消息
            case chatAction.transmitGroupMessage:

                // 转发单聊图片消息
            case chatAction.transmitGroupPic:

                // 转发单聊文件消息
            case chatAction.transmitGroupFile:

                // 转发单聊位置
            case chatAction.transmitSingleLocation:

                // 转发群聊位置
            case chatAction.transmitGroupLocation:
                this.conversationList = chatState.conversation;
                break;
            case chatAction.emptyUnreadNumSyncEvent:
                this.conversationList = chatState.conversation;
                if (chatState.msgId.length > 0) {
                    this.storageMsgId(chatState.msgId);
                }
                break;
                // 转发消息成功(如果全部成功则为成功，有一个用户失败则不成功，会提示相关信息)
            case chatAction.transmitMessageComplete:
                this.modalTipTransmitSuccess(chatState);
                if (chatState.msgId.length > 0) {
                    this.storageMsgId(chatState.msgId);
                }
                break;
            case contactAction.agreeAddFriendSuccess:
                this.conversationList = chatState.conversation;
                this.store$.dispatch({
                    type: chatAction.dispatchFriendList,
                    payload: chatState.friendList
                });
                this.otherOptionScrollBottom = !this.otherOptionScrollBottom;
                break;
            case chatAction.friendReplyEventSuccess:
                this.otherInfo = chatState.otherInfo;
                this.changeOtherInfoFlag = !this.changeOtherInfoFlag;
                this.store$.dispatch({
                    type: chatAction.dispatchFriendList,
                    payload: chatState.friendList
                });
                this.otherOptionScrollBottom = !this.otherOptionScrollBottom;
                break;
            case chatAction.showVerifyModal:
                this.verifyModal = chatState.verifyModal;
                break;
            case chatAction.deleteSingleBlackSuccess:

            case mainAction.addSingleNoDisturbSuccess:

            case chatAction.deleteSingleNoDisturbSuccess:
                this.otherInfo = chatState.otherInfo;
                this.changeOtherInfoFlag = !this.changeOtherInfoFlag;
                break;
            case chatAction.saveMemoNameSuccess:

            case chatAction.deleteFriendSyncEvent:

            case chatAction.addFriendSyncEvent:
                this.conversationList = chatState.conversation;
                this.changeOtherInfoFlag = !this.changeOtherInfoFlag;
                this.store$.dispatch({
                    type: chatAction.dispatchFriendList,
                    payload: chatState.friendList
                });
                break;
            case chatAction.userInfUpdateEventSuccess:
                this.store$.dispatch({
                    type: chatAction.dispatchFriendList,
                    payload: chatState.friendList
                });
                this.otherInfo.info = chatState.otherInfo.info;
                break;
            case mainAction.deleteFriendSuccess:
                this.store$.dispatch({
                    type: chatAction.dispatchFriendList,
                    payload: chatState.friendList
                });
                this.otherInfo = chatState.otherInfo;
                this.changeOtherInfoFlag = !this.changeOtherInfoFlag;
                this.conversationList = chatState.conversation;
                this.defaultPanelIsShow = chatState.defaultPanelIsShow;
                this.unreadList.show = false;
                break;
            case chatAction.addGroupBlackSyncEvent:

            case chatAction.addSingleNoDisturbSyncEvent:

            case chatAction.deleteSingleNoDisturbSyncEvent:

            case chatAction.addGroupNoDisturbSyncEvent:
                this.changeOtherInfoFlag = !this.changeOtherInfoFlag;
                break;
            // case chatAction.groupAvatar:
            //     this.conversationList = chatState.conversation;
            //     this.groupSetting.groupInfo = messageListActive.groupSetting.groupInfo;
            //     break;
            case chatAction.conversationToTopSuccess:
                this.conversationList = chatState.conversation;
                break;
            case chatAction.watchUnreadList:
                this.unreadList = chatState.unreadList;
                break;
            case chatAction.watchUnreadListSuccess:
                this.unreadList = chatState.unreadList;
                break;
            case chatAction.msgReceiptChangeEvent:
                this.conversationList = chatState.conversation;
                break;
            case mainAction.dispatchSendSelfCard:
                this.sendCardEmit();
                break;
            default:
        }
    }
    private modalTipSendCardSuccess (chatState) {
        let count = this.sendBusinessCardCount;
        console.log(count, chatState.sendBusinessCardSuccess);
        if (count !== 0 && count === chatState.sendBusinessCardSuccess) {
            this.store$.dispatch({
                type: mainAction.showModalTip,
                payload: {
                    show: true,
                    info: {
                        title: '成功',          // 模态框标题
                        tip: '发送名片成功',   // 模态框内容
                        actionType: '[main] send business card success', // 哪种操作，点击确定时可以执行对应操作
                        success: 1              // 成功的提示框/失败的提示框，1.5s后会自动消失
                    }
                }
            });
        }
        this.sendBusinessCardCount = 0;
        this.store$.dispatch({
            type: chatAction.hideOtherInfo,
            payload: {
                show: false,
                info: {}
            }
        });
        this.store$.dispatch({
            type: mainAction.showSelfInfo,
            payload: {
                show: false,
                loading: false
            }
        });
    }
    private modalTipTransmitSuccess (chatState) {
        let count = this.transmitItem.totalTransmitNum;
        if (count !== 0 && chatState.transmitSuccess === count) {
            this.store$.dispatch({
                type: mainAction.showModalTip,
                payload: {
                    show: true,
                    info: {
                        title: '成功',          // 模态框标题
                        tip: '转发成功',   // 模态框内容
                        actionType: '[main] transmit success', // 哪种操作，点击确定时可以执行对应操作
                        success: 1              // 成功的提示框/失败的提示框，1.5s后会自动消失
                    }
                }
            });
        }
    }
    private asyncEvent(data) {
        switch (data.event_type) {
            case 1:
                this.store$.dispatch({
                    type: mainAction.logoutKickShow,
                    payload: {
                        show: true,
                        info: {
                            title: '提示',
                            tip: '您的账号在其他设备登录'
                        }
                    }
                });
                break;
            case 2:
                this.store$.dispatch({
                    type: mainAction.logoutKickShow,
                    payload: {
                        show: true,
                        info: {
                            title: '提示',
                            tip: '您的密码已在其他设备修改，请重新登录',
                            hideRepeateLoginBtn: true
                        }
                    }
                });
                break;
            case 6:
                if (!data.isOffline) {
                    if (data.extra === 0) {
                        this.store$.dispatch({
                            type: chatAction.getFriendList,
                            payload: null
                        });
                    }
                }
                break;
            case 5:
                // 好友请求和应答事件
                this.store$.dispatch({
                    type: chatAction.friendEvent,
                    payload: data
                });
                this.notification(data);
                break;
            case 7:
                if (!data.isOffline) {
                    if (data.extra === 0) {
                        this.store$.dispatch({
                            type: chatAction.getFriendList,
                            payload: null
                        });
                    }
                }
                break;
            case 8:
                // 创建群的事件
                if (data.from_username === '') {
                    this.store$.dispatch({
                        type: chatAction.createGroupEvent,
                        payload: data
                    });
                }
                break;
            case 9:
                // 退群事件
                if (data.to_usernames[0].username !== global.user) {
                    this.store$.dispatch({
                        type: chatAction.exitGroupEvent,
                        payload: data
                    });
                } else {
                    this.store$.dispatch({
                        type: mainAction.exitGroupSuccess,
                        payload: {
                            item: {
                                type: 4,
                                name: data.group_name,
                                key: data.gid
                            }
                        }
                    });
                }
                break;
            case 10:
                // 添加群成员事件
                if (data.extra === 0) {
                    this.store$.dispatch({
                        type: chatAction.addGroupMembersEvent,
                        payload: data
                    });
                }
                break;
            case 11:
                // 删除群成员事件
                if (data.extra === 0) {
                    this.store$.dispatch({
                        type: chatAction.deleteGroupMembersEvent,
                        payload: data
                    });
                }
                break;
            case 12:
                // 更新群信息事件
                if (!data.isOffline) {
                    this.store$.dispatch({
                        type: chatAction.updateGroupInfoEvent,
                        payload: data
                    });
                }
                break;
            case 40:
                if (!data.isOffline) {
                    if (data.extra === 0) {
                        this.store$.dispatch({
                            type: mainAction.getSelfInfo,
                            payload: null
                        });
                    }
                }
            case 55:
                // 消息撤回事件，不考虑离线的消息撤回事件
                if (!data.isOffline) {
                    this.store$.dispatch({
                        type: chatAction.msgRetractEvent,
                        payload: data
                    });
                }
                break;
            case 100:
                if (!data.isOffline) {
                    this.updateFriendListSyncEvent(data);
                }
                break;
            case 101:
                if (!data.isOffline) {
                    if (data.extra === 1) {
                        this.store$.dispatch({
                            type: chatAction.addGroupBlackSyncEvent,
                            payload: data
                        });
                        this.store$.dispatch({
                            type: mainAction.blackMenu,
                            payload: {
                                show: null
                            }
                        });
                    } else if (data.extra === 2) {
                        this.store$.dispatch({
                            type: chatAction.deleteGroupBlackSyncEvent,
                            payload: data
                        });
                        this.store$.dispatch({
                            type: mainAction.blackMenu,
                            payload: {
                                show: null
                            }
                        });
                    }
                }
                break;
            case 102:
                if (!data.isOffline) {
                    this.updateNoDisturbSyncEvent(data);
                }
                break;
            case 103:
                if (!data.isOffline) {
                    if (data.extra === 1) {
                        this.store$.dispatch({
                            type: chatAction.addGroupShieldSyncEvent,
                            payload: data
                        });
                    } else if (data.extra === 2) {
                        this.store$.dispatch({
                            type: chatAction.deleteGroupShieldSyncEvent,
                            payload: data
                        });
                    }
                }
                break;
            case 200:
                if (!data.isOffline) {
                    if (data.description && data.description.username) {
                        data.description.name = data.description.username;
                    }
                    this.store$.dispatch({
                        type: chatAction.emptyUnreadNumSyncEvent,
                        payload: data.description
                    });
                }
                break;
            default:
        }
    }
    private updateFriendListSyncEvent(data) {
        if (data.extra === 5) {
            this.store$.dispatch({
                type: chatAction.getFriendList,
                payload: null
            });
            this.store$.dispatch({
                type: chatAction.addFriendSyncEvent,
                payload: data
            });
        } else if (data.extra === 6) {
            this.store$.dispatch({
                type: chatAction.getFriendList,
                payload: null
            });
            this.store$.dispatch({
                type: chatAction.deleteFriendSyncEvent,
                payload: data
            });
        } else if (data.extra === 7) {
            this.store$.dispatch({
                type: chatAction.saveMemoNameSuccess,
                payload: data
            });
        }
    }
    private updateNoDisturbSyncEvent(data) {
        switch (data.extra) {
            case 31:
                this.store$.dispatch({
                    type: chatAction.addSingleNoDisturbSyncEvent,
                    payload: data
                });
                break;
            case 32:
                this.store$.dispatch({
                    type: chatAction.deleteSingleNoDisturbSyncEvent,
                    payload: data
                });
                break;
            case 33:
                this.store$.dispatch({
                    type: chatAction.addGroupNoDisturbSyncEvent,
                    payload: data
                });
                break;
            case 34:
                this.store$.dispatch({
                    type: chatAction.deleteGroupNoDisturbSyncEvent,
                    payload: data
                });
                break;
            default:
        }
    }
    // 通知栏
    private notification(newMessage) {
        if (!this.windowIsFocus) {
            let title = '';
            let body = '';
            // 验证消息
            if (newMessage.hasOwnProperty('isOffline')) {
                if (newMessage.extra === 1) {
                    title = '好友邀请';
                    body = `${newMessage.from_nickname || newMessage.from_username}申请添加您为好友`;
                } else if (newMessage.extra === 2) {
                    if (newMessage.return_code === 0) {
                        title = '同意好友申请';
                        body = `${newMessage.from_nickname || newMessage.from_username}同意了您的好友申请`;
                    } else {
                        title = '拒绝好友申请';
                        body = `${newMessage.from_nickname || newMessage.from_username}拒绝了您的好友申请`;
                    }
                }
            // 普通消息
            } else {
                if (newMessage.msg_type === 4) {
                    title = newMessage.content.target_name || '群';
                    body += `${newMessage.content.memo_name ||
                            newMessage.content.from_name || newMessage.content.from_id}:`;
                } else {
                    title = newMessage.content.memo_name ||
                            newMessage.content.from_name || newMessage.content.from_id || ' ';
                }
                switch (newMessage.content.msg_type) {
                    case 'text':
                        body += newMessage.content.msg_body.text;
                        break;
                    case 'image':
                        body += '[图片]';
                        break;
                    case 'location':
                        body += '[位置]';
                        break;
                    case 'voice':
                        body += '[语音]';
                        break;
                    case 'file':
                        let extras = newMessage.content.msg_body.extras;
                        if (extras && extras.video) {
                            body += '[视频]';
                        } else {
                            body += '[文件]';
                        }
                        break;
                    default:
                        body += '消息';
                }
            }
            Push.create(title, {
                body,
                icon: '../../../assets/images/notification-icon.png',
                timeout: 4000,
                onClick () {
                    window.focus();
                    this.close();
                }
            });
            this.newMessageNotice.num ++;
            clearInterval(this.newMessageNotice.timer);
            this.newMessageNotice.timer = setInterval(() => {
                if (document.title === 'JChat - 极光 IM Demo') {
                    document.title = `jchat(${this.newMessageNotice.num})`;
                } else {
                    document.title = 'JChat - 极光 IM Demo';
                }
                if (this.newMessageNotice.num === 0) {
                    clearInterval(this.newMessageNotice.timer);
                    document.title = 'JChat - 极光 IM Demo';
                }
            }, 1000);
        }
    }
    // 存储消息id(用来计算消息未读数)
    private storageMsgId(msgId) {
        this.storageKey = `msgId-${authPayload.appKey}-${global.user}`;
        this.storageService.set(this.storageKey, JSON.stringify(msgId));
    }
    // 更新当前对话用户信息
    private changeActivePerson(chatState) {
        this.closeGroupSettingEmit();
        this.active = chatState.activePerson;
        this.store$.dispatch({
            type: chatAction.updateUnreadCount,
            payload: this.active
        });
        this.changeActiveScrollBottom = !this.changeActiveScrollBottom;
        // this.groupSetting.show = false;
        // 判断是否已经缓存
        if (this.isCacheArr.indexOf(this.active.key) === -1) {
            this.isCacheArr.push(this.active.key);
            if (this.active.type === 4) {
                this.store$.dispatch({
                    type: chatAction.getGroupMembers,
                    payload: this.active
                });
            }
            this.store$.dispatch({
                type: chatAction.getSourceUrl,
                payload: {
                    active: this.active,
                    messageList: this.messageList,
                    loadingCount: 1 // 加载的页数
                }
            });
            // 获取messageList avatar url
            if (this.active.type === 4) {
                this.store$.dispatch({
                    type: chatAction.getMemberAvatarUrl,
                    payload: {
                        active: this.active,
                        messageList: this.messageList,
                        loadingCount: 1 // 加载的页数
                    }
                });
            } else {
                this.store$.dispatch({
                    type: chatAction.getSingleAvatarUrl,
                    payload: null
                });
            }
        }
    }
    // 切换当前对话用户
    private selectTargetEmit(item) {
        if ((item.type === 4 && Number(this.active.key) === Number(item.key)) ||
            (item.type === 3 && this.active.name === item.name)) {
            return ;
        }
        this.store$.dispatch({
            type: chatAction.changeActivePerson,
            payload: {
                item,
                defaultPanelIsShow: false
            }
        });
    }
    // 滚动加载消息列表
    private loadMoreEmit (num) {
        // num.loadingCount 滚动加载第几页的页数
        if (this.active.activeIndex < 0) {
            return;
        }
        this.store$.dispatch({
            type: chatAction.getSourceUrl,
            payload: {
                active: this.active,
                messageList: this.messageList,
                loadingCount: num.loadingCount
            }
        });
        if (this.active.type === 4) {
            this.store$.dispatch({
                type: chatAction.getMemberAvatarUrl,
                payload: {
                    active: this.active,
                    messageList: this.messageList,
                    loadingCount: num.loadingCount
                }
            });
        }
    }
    // 删除本地会话列表
    private deleteConversationItemEmit(item) {
        this.store$.dispatch({
            type: chatAction.deleteConversationItem,
            payload: {
                item
            }
        });
    }
    // 发送文本消息
    private sendMsgEmit(data, active ?) {
        let activePerson = active || this.active;
        console.log(555, data);
        // repeatSend = true重发消息
        /**
         * success
         * 取值 状态
         * 1  正在发送
         * 2  发送成功
         * 3  发送失败
         */
        let msgs: any = {
            content: {
                create_time: new Date().getTime(),
                msg_type: 'text',
                from_id: global.user,
                msg_body: {
                    text: data.content,
                    extras: data.localExtras
                }
            },
            ctime_ms: new Date().getTime(),
            success: 1,
            msgKey: this.msgKey ++,
            unread_count: 0
        };
        // 转发消息失败重发单聊消息
        if (activePerson.type === 3 && data.repeatSend && data.isTransmitMsg) {
            this.store$.dispatch({
                type: chatAction.transmitSingleMessage,
                payload: {
                    msgs: data,
                    select: {
                        name: activePerson.name,
                        type: 3
                    },
                    key: activePerson.key
                }
            });
        // 转发消息失败重发群聊消息
        }else if (activePerson.type === 4 && data.repeatSend && data.isTransmitMsg) {
            this.store$.dispatch({
                type: chatAction.transmitGroupMessage,
                payload: {
                    msgs: data,
                    select: {
                        key: activePerson.key,
                        type: 4
                    },
                    key: activePerson.key
                }
            });
        // 发送单聊消息
        }else if (activePerson.type === 3 && !data.repeatSend) {
            let singleMsg: any = {
                target_username: activePerson.name,
                // target_nickname: this.active.nickName,
                content: data.content,
                nead_receipt: true
            };
            if (data.extras) {
                singleMsg.extras = data.extras;
            }
            msgs.singleMsg = singleMsg;
            msgs.msg_type = 3;
            this.store$.dispatch({
                type: chatAction.sendSingleMessage,
                payload: {
                    singleMsg,
                    key: activePerson.key,
                    msgs,
                    active: activePerson
                }
            });
        // 发送群组消息
        }else if (activePerson.type === 4 && !data.repeatSend) {
            let groupMsg: any = {
                target_gid: activePerson.key,
                // target_gname: this.active.name,
                content: data.content,
                nead_receipt: true
            };
            if (data.extras) {
                groupMsg.extras = data.extras;
            }
            if (data.isAtAll) {
                groupMsg.at_list = [];
            } else if (data.atList && data.atList.length > 0) {
                groupMsg.at_list = data.atList;
            }
            msgs.groupMsg = groupMsg;
            msgs.msg_type = 4;
            this.store$.dispatch({
                type: chatAction.sendGroupMessage,
                payload: {
                    groupMsg,
                    key: activePerson.key,
                    msgs,
                    active: activePerson
                }
            });
        // 重发单聊消息
        }else if (activePerson.type === 3 && data.repeatSend) {
            this.store$.dispatch({
                type: chatAction.sendSingleMessage,
                payload: {
                    singleMsg: data.singleMsg,
                    key: activePerson.key,
                    msgs: data,
                    active: activePerson
                }
            });
        // 重发群聊消息
        }else if (activePerson.type === 4 && data.repeatSend) {
            this.store$.dispatch({
                type: chatAction.sendGroupMessage,
                payload: {
                    groupMsg: data.groupMsg,
                    key: activePerson.key,
                    msgs: data,
                    active: activePerson
                }
            });
        }
    }
    // 发送图片消息
    private sendPicEmit(data) {
        let msgs;
        const file = this.elementRef.nativeElement.querySelector('#sendPic');
        // repeatSend = true重发消息
        if (data.repeatSend && this.active.type === 3 && data.isTransmitMsg) {
            this.store$.dispatch({
                type: chatAction.transmitSinglePic,
                payload: {
                    msgs: data,
                    select: {
                        name: this.active.name,
                        type: 3
                    },
                    key: this.active.key
                }
            });
            return ;
        }else if (data.repeatSend && this.active.type === 4 && data.isTransmitMsg) {
            this.store$.dispatch({
                type: chatAction.transmitGroupPic,
                payload: {
                    msgs: data,
                    select: {
                        key: this.active.key,
                        type: 4
                    },
                    key: this.active.key
                }
            });
            return ;
        } else if (data.repeatSend && this.active.type === 3) {
            this.store$.dispatch({
                type: chatAction.sendSinglePic,
                payload: {
                    singlePicFormData: data.singlePicFormData,
                    key: this.active.key,
                    msgs: data,
                    active: this.active
                }
            });
            return ;
        }else if (data.repeatSend && this.active.type === 4) {
            this.store$.dispatch({
                type: chatAction.sendGroupPic,
                payload: {
                    groupPicFormData: data.groupPicFormData,
                    key: this.active.key,
                    msgs: data,
                    active: this.active
                }
            });
            return ;
        }
        // 粘贴图片发送
        if (data.type === 'paste') {
            this.sendPicContent(msgs, data.info, data.img);
        // 正常发送图片
        } else {
            this.util.imgReader(file, () => {
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
                this.sendPicContent(msgs, value, data.img);
            });
        }
    }
    private sendPicContent(msgs, value, data) {
        msgs = {
            content: {
                from_id: global.user,
                create_time: new Date().getTime(),
                msg_type: 'image',
                msg_body: {
                    media_url: value.src,
                    width: value.width,
                    height: value.height
                }
            },
            ctime_ms: new Date().getTime(),
            success: 1,
            msgKey: this.msgKey ++,
            unread_count: 0
        };
        // 发送单聊图片
        if (this.active.type === 3) {
            let singlePicFormData = {
                target_username: this.active.name,
                // target_nickname: this.active.nickName,
                appkey: authPayload.appKey,
                image: data,
                nead_receipt: true
            };
            msgs.singlePicFormData = singlePicFormData;
            msgs.msg_type = 3;
            this.store$.dispatch({
                type: chatAction.sendSinglePic,
                payload: {
                    singlePicFormData,
                    key: this.active.key,
                    msgs,
                    active: this.active
                }
            });
        // 发送群聊图片
        }else if (this.active.type === 4) {
            let groupPicFormData = {
                target_gid: this.active.key,
                // target_gname: this.active.name,
                image: data,
                nead_receipt: true
            };
            msgs.groupPicFormData = groupPicFormData;
            msgs.msg_type = 4;
            this.store$.dispatch({
                type: chatAction.sendGroupPic,
                payload: {
                    groupPicFormData,
                    key: this.active.key,
                    msgs,
                    active: this.active
                }
            });
        }
    }
    private sendFileEmit(data) {
        // 转发消息失败重发消息
        if (data.repeatSend && this.active.type === 3 && data.isTransmitMsg) {
            this.store$.dispatch({
                type: chatAction.transmitSingleFile,
                payload: {
                    msgs: data,
                    select: {
                        name: this.active.name,
                        type: 3
                    },
                    key: this.active.key
                }
            });
            return ;
        }else if (data.repeatSend && this.active.type === 4 && data.isTransmitMsg) {
            this.store$.dispatch({
                type: chatAction.transmitGroupFile,
                payload: {
                    msgs: data,
                    select: {
                        key: this.active.key,
                        type: 4
                    },
                    key: this.active.key
                }
            });
            return ;
        }
        // repeatSend = true重发消息
        let msgs;
        if (!data.repeatSend) {
            const ext = this.util.getExt(data.fileData.name);
            msgs  = {
                content: {
                    create_time: (new Date()).getTime(),
                    msg_type: 'file',
                    from_id: global.user,
                    msg_body: {
                        fname: data.fileData.name,
                        fsize: data.fileData.size,
                        extras: {
                            fileSize: data.fileData.size,
                            fileType: ext
                        }
                    }
                },
                ctime_ms: (new Date()).getTime(),
                success: 1,
                msgKey: this.msgKey ++,
                unread_count: 0
            };
        }
        // 发送单聊文件
        if (this.active.type === 3 && !data.repeatSend) {
            const ext = this.util.getExt(data.fileData.name);
            let singleFile = {
                file: data.file,
                target_username: this.active.name,
                appkey: authPayload.appKey,
                extras: {
                    fileSize: data.fileData.size,
                    fileType: ext
                },
                nead_receipt: true
            };
            msgs.singleFile = singleFile;
            msgs.msg_type = 3;
            this.store$.dispatch({
                type: chatAction.sendSingleFile,
                payload: {
                    key: this.active.key,
                    msgs,
                    singleFile,
                    active: this.active
               }
            });
        // 发送群组文件
        }else if (this.active.type === 4 && !data.repeatSend) {
            const ext = this.util.getExt(data.fileData.name);
            let groupFile = {
                file : data.file,
                target_gid: this.active.key,
                extras: {
                    fileSize: data.fileData.size,
                    fileType: ext
                },
                nead_receipt: true
            };
            msgs.groupFile = groupFile;
            msgs.msg_type = 4;
            this.store$.dispatch({
                type: chatAction.sendGroupFile,
                payload: {
                    key: this.active.key,
                    msgs,
                    groupFile,
                    active: this.active
                }
            });
        }else if (this.active.type === 3 && data.repeatSend) {
            this.store$.dispatch({
                type: chatAction.sendSingleFile,
                payload: {
                    key: this.active.key,
                    msgs: data,
                    singleFile: data.singleFile,
                    active: this.active
               }
            });
        }else if (this.active.type === 4 && data.repeatSend) {
            this.store$.dispatch({
                type: chatAction.sendGroupFile,
                payload: {
                    key: this.active.key,
                    msgs: data,
                    groupFile: data.groupFile,
                    active: this.active
                }
            });
        }
    }
    // 转发位置消息失败重发
    private sendLocationEmit(data) {
        let type = '';
        let payload;
        if (this.active.type === 3) {
            type = chatAction.transmitSingleLocation;
            payload = {
                msgs: data,
                select: {
                    name: this.active.name,
                    type: 3
                },
                key: this.active.key
            };
        } else {
            type = chatAction.transmitGroupLocation;
            payload = {
                msgs: data,
                select: {
                    key: this.active.key,
                    type: 4
                },
                key: this.active.key
            };
        }
        this.store$.dispatch({
            type,
            payload
        });
    }
    // 保存草稿
    private saveDraftEmit(tempArr) {
        this.store$.dispatch({
            type: chatAction.saveDraft,
            payload: tempArr
        });
    }
    // 查看用户信息
    private watchOtherInfoEmit(info) {
        this.store$.dispatch({
            type: chatAction.watchOtherInfo,
            payload: info
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
    // 用户信息面板中，关闭面板或者建立单聊
    private OtherInfoEmit(item) {
        console.log(333333333, item);
        if (item && item.name !== this.active.name) {
            this.store$.dispatch({
                type: chatAction.createOtherChat,
                payload: item
            });
        }
        this.store$.dispatch({
            type: chatAction.hideOtherInfo,
            payload: {
                show: false,
                info: {}
            }
        });
    }
    // 查看群设置
    private groupSettingEmit() {
        let groupSetting = this.messageList[this.active.activeIndex].groupSetting;
        this.store$.dispatch({
            type: chatAction.groupSetting,
            payload: {
                active: this.active,
                show: true,
                // 是否已经请求过
                isCache: groupSetting && groupSetting.groupInfo,
                loading: true
            }
        });
    }
    // 关闭群设置
    private closeGroupSettingEmit() {
        this.store$.dispatch({
            type: chatAction.groupSetting,
            payload: {
                show: false
            }
        });
    }
    // 退出群聊
    private exitGroupEmit(groupInfo) {
        this.store$.dispatch({
            type: mainAction.showModalTip,
            payload: {
                show: true,
                info: {
                    groupInfo,
                    title: '退群',
                    tip: `确定要退出 ${groupInfo.name} 吗？`,
                    actionType: '[chat] exit group'
                }
            }
        });
    }
    // 增加或者取消单聊黑名单
    private changeSingleBlackEmit(otherInfo) {
        if (otherInfo.black) {
            this.store$.dispatch({
                type: chatAction.deleteSingleBlack,
                payload: otherInfo
            });
        } else {
            this.store$.dispatch({
                type: mainAction.showModalTip,
                payload: {
                    show: true,
                    info: {
                        active: otherInfo,
                        title: '加入黑名单',
                        tip: `确定将 ${otherInfo.nickname || otherInfo.username} 加入黑名单吗？`,
                        actionType: '[chat] add black list'
                    }
                }
            });
        }
    }
    // 增加或者取消单聊免打扰
    private changeSingleNoDisturbEmit(otherInfo) {
        if (otherInfo.noDisturb) {
            this.store$.dispatch({
                type: chatAction.deleteSingleNoDisturb,
                payload: otherInfo
            });
        } else {
            this.store$.dispatch({
                type: mainAction.showModalTip,
                payload: {
                    show: true,
                    info: {
                        active: otherInfo,
                        title: '消息免打扰',
                        tip: `确定将 ${otherInfo.nickname || otherInfo.username} 加入免打扰吗？`,
                        subTip: '设置之后正常接收消息，但无通知提示',
                        actionType: '[chat] add single no disturb modal'
                    }
                }
            });
        }
    }
    // 删除群成员
    private deleteMemberEmit(item) {
        this.store$.dispatch({
            type: mainAction.showModalTip,
            payload: {
                show: true,
                info: {
                    group: this.active,
                    deleteItem: item,
                    title: '删除群成员',
                    tip: `确定删除群成员 ${item.nickName || item.username} 吗？`,
                    actionType: '[chat] delete member'
                }
            }
        });
    }
    // 显示群描述模态框
    private modifyGroupDescriptionEmit() {
        this.store$.dispatch({
            type: chatAction.groupDescription,
            payload: {
                show: true
            }
        });
    }
    // 更新群信息
    private updateGroupInfoEmit(newGroupInfo) {
        if (newGroupInfo) {
            this.store$.dispatch({
                type: chatAction.updateGroupInfo,
                payload: newGroupInfo
            });
        } else {
            this.store$.dispatch({
                type: chatAction.groupDescription,
                payload: {
                    show: false
                }
            });
        }
    }
    // 多人会话
    private addGroupEmit() {
        this.store$.dispatch({
            type: mainAction.createGroupShow,
            payload: {
                show: true,
                info: {
                    activeSingle: this.active,
                    action: 'many',
                    selfInfo: this.selfInfo
                }
            }
        });
    }
    // 添加群成员
    private addMemberEmit() {
        this.store$.dispatch({
            type: mainAction.createGroupShow,
            payload: {
                show: true,
                info: {
                    filter: this.groupSetting.memberList,
                    action: 'add',
                    activeGroup: this.active
                }
            }
        });
    }
    // 修改群名
    private modifyGroupNameEmit(newGroupName) {
        let groupSetting = Object.assign({}, this.groupSetting.groupInfo,
            {name: newGroupName, actionType: 'modifyName'});
        this.store$.dispatch({
            type: chatAction.updateGroupInfo,
            payload: groupSetting
        });
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
    // 关闭视频模态框
    private closeVideoEmit() {
        this.store$.dispatch({
            type: chatAction.playVideoShow,
            payload: {
                url: '',
                show: false
            }
        });
    }
    // 消息撤回
    private MsgRetractEmit(item) {
        this.store$.dispatch({
            type: chatAction.msgRetract,
            payload: item
        });
    }
    // 转发消息或发送名片弹窗显示
    private msgTransmitEmit(item) {
        this.messageTransmit.list = this.conversationList;
        this.messageTransmit.show = true;
        this.messageTransmit.type = 'msgTransmit';
        this.transmitItem = this.util.deepCopyObj(item);
    }
    // 转发消息或发送名片弹窗搜索
    private searchMessageTransmitEmit(keywords) {
        this.store$.dispatch({
            type: chatAction.searchMessageTransmit,
            payload: keywords
        });
    }
    // 转发消息或发送名片
    private confirmTransmitEmit(info) {
        if (info.type === 'sendCard') {
            this.sendCardConfirm(info);
            return;
        }
        if (info.type === 'msgTransmit') {
            this.msgTransmitConfirm(info);
            return;
        }
    }
    private sendCardConfirm(info) {
        this.sendBusinessCardCount = 0;
        console.log(7777, info.selectList);
        let newInfo;
        if (this.otherInfo.show) {
            newInfo = this.otherInfo.info;
        } else {
            if (this.selfInfo.username) {
                this.selfInfo.name = this.selfInfo.username;
            }
            if (this.selfInfo.nickname) {
                this.selfInfo.nickName = this.selfInfo.nickname;
            }
            newInfo = this.selfInfo;
        }
        for (let select of info.selectList) {
            let msg = {
                content: '推荐了一张名片',
                extras: {
                    userName: newInfo.name,
                    appKey: newInfo.appkey,
                    businessCard: 'businessCard'
                },
                localExtras: {
                    userName: newInfo.name,
                    appKey: newInfo.appkey,
                    businessCard: 'businessCard',
                    media_url: newInfo.avatarUrl,
                    nickName: newInfo.nickName
                }
            };
            this.sendBusinessCardCount ++;
            this.sendMsgEmit(msg, select);
        }
    }
    private businessCardSendEmit(user) {
        console.log(555, user);
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
            }
        };
        this.sendMsgEmit(msg);
    }
    private msgTransmitConfirm(info) {
        delete this.transmitItem.msg_id;
        this.transmitItem.msgKey = this.msgKey ++;
        this.transmitItem.totalTransmitNum = info.selectList.length;
        this.transmitItem.ctime_ms = new Date().getTime();
        this.transmitItem.conversation_time_show = 'today';
        this.transmitItem.time_show = '';
        this.transmitItem.showMoreIcon = false;
        this.transmitItem.hasLoad = false;
        this.transmitItem.content.from_id = global.user;
        this.transmitItem.isTransmitMsg = true;
        this.transmitItem.unread_count = 0;
        this.transmitItem.success = 1;
        for (let item of info.selectList) {
            this.transmitItem.content.target_id = item.name;
            this.transmitItem.type = item.type;
            if (item.type === 3) {
                this.transmitItem.msg_type = 3;
            } else {
                this.transmitItem.msg_type = 4;
            }
            let data = {
                select: item,
                msgs: Object.assign({}, this.transmitItem, {}),
                key: item.key
            };
            let type = '';
            switch (this.transmitItem.content.msg_type) {
                case 'text':
                    if (item.type === 3) {
                        type = chatAction.transmitSingleMessage;
                    } else {
                        type = chatAction.transmitGroupMessage;
                    }
                    break;
                case 'image':
                    if (item.type === 3) {
                        type = chatAction.transmitSinglePic;
                    } else {
                        type = chatAction.transmitGroupPic;
                    }
                    break;
                case 'file':
                    if (item.type === 3) {
                        type = chatAction.transmitSingleFile;
                    } else {
                        type = chatAction.transmitGroupFile;
                    }
                    break;
                case 'location':
                    if (item.type === 3) {
                        type = chatAction.transmitSingleLocation;
                    } else {
                        type = chatAction.transmitGroupLocation;
                    }
                    break;
                default:
            }
            this.store$.dispatch({
                type,
                payload: data
            });
        }
    }
    private addFriendEmit(user) {
        this.store$.dispatch({
            type: chatAction.showVerifyModal,
            payload: {
                info: user,
                show: true
            }
        });
    }
    // 验证消息模态框的按钮
    private verifyModalBtnEmit(verifyModalText) {
        let userInfo = Object.assign({}, this.verifyModal.info, {verifyModalText});
        this.store$.dispatch({
            type: chatAction.addFriendConfirm,
            payload: userInfo
        });
        this.store$.dispatch({
            type: chatAction.showVerifyModal,
            payload: {
                info: {},
                show: false
            }
        });
    }
    // 修改备注名
    private saveMemoNameEmit(info) {
        this.store$.dispatch({
            type: chatAction.saveMemoName,
            payload: info
        });
    }
    // 删除好友
    private deleteFriendEmit(info) {
        this.store$.dispatch({
            type: mainAction.showModalTip,
            payload: {
                show: true,
                info: {
                    active: info,
                    title: '删除好友',
                    tip: `确定删除好友 ${info.memo_name || info.nickName || info.name} 吗？`,
                    actionType: '[chat] delete friend modal'
                }
            }
        });
    }
    private sendCardEmit() {
        this.messageTransmit.list = this.conversationList;
        this.messageTransmit.show = true;
        this.messageTransmit.type = 'sendCard';
    }
    private verifyUserBtnEmit(verifyUser) {
        this.store$.dispatch({
            type: chatAction.hideOtherInfo,
            payload: {
                show: false,
                info: {}
            }
        });
        this.store$.dispatch({
            type: contactAction.isAgreeAddFriend,
            payload: verifyUser
        });
    }
    private updateGroupAvatarEmit(groupAvatarInput) {
        this.getImgObj(groupAvatarInput.files[0]);
        groupAvatarInput.value = '';
    }
    private selectIsNotImage() {
        this.store$.dispatch({
            type: mainAction.showModalTip,
            payload: {
                show: true,
                info: {
                    title: '提示',
                    tip: '选择的文件必须是图片',
                    actionType: '[main] must be image',
                    cancel: true
                }
            }
        });
    }
    private getImgObj(file) {
        if (!file || !file.type || file.type === '') {
            return false;
        }
        if (!/image\/\w+/.test(file.type)) {
            this.selectIsNotImage();
            return false;
        }
        const that = this;
        let img = new Image();
        let pasteFile = file;
        let reader = new FileReader();
        reader.readAsDataURL(pasteFile);
        let fd = new FormData();
        fd.append(file.name, file);
        reader.onload = function(e) {
            img.src = this.result;
            const _this = this;
            img.onload = function() {
                that.groupAvatar.info = {
                    src: _this.result,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    pasteFile
                };
                that.groupAvatar.formData = fd;
                that.groupAvatar.src =  _this.result;
                that.groupAvatar.show = true;
            };
        };
    }
    private groupAvatarEmit(groupAvatarInfo) {
        let groupSetting = {
            gid: this.groupSetting.groupInfo.gid,
            avatar: groupAvatarInfo.formData,
            actionType: 'modifyGroupAvatar',
            src: groupAvatarInfo.src
        };
        this.store$.dispatch({
            type: chatAction.updateGroupInfo,
            payload: groupSetting
        });
    }
    private conversationToTopEmit(item) {
        if (item.key > 0) {
            this.store$.dispatch({
                type: chatAction.conversationToTop,
                payload: item
            });
        } else {
            this.store$.dispatch({
                type: chatAction.conversationToTopSuccess,
                payload: item
            });
        }
    }
    private readListOtherInfoEmit(info) {
        this.store$.dispatch({
            type: chatAction.watchOtherInfo,
            payload: info
        });
    }
    private init() {
        this.isLoaded = false;
        this.conversationList = [];
        this.messageList = [
            {
                key: 0,
                msgs: [],
                groupSetting: {
                    groupInfo: {},
                    memberList: []
                }
            }
        ];
        this.active = {
            name: '',
            nickName: '',
            key: '',
            activeIndex: -1,
            type: 0,
            change: false,
            shield: false,
            appkey: ''
        };
        this.defaultPanelIsShow = true;
        this.otherInfo = {
            show: false,
            info: {
                name: '',
                appkey: '',
                avatarUrl: '',
                nickName: ''
            }
        };
        this.blackMenu = {
            show: false,
            menu: []
        };
        this.groupSetting = {
            groupInfo: {
                name: '',
                desc: '',
                gid: 0
            },
            memberList: [],
            active: {},
            show: false
        };
        this.msgKey = 1;
        this.groupDescription = {
            show: false,
            description: {}
        };
        this.selfInfo = {};
        this.isCacheArr = [];
        this.playVideoShow = {
            show: false,
            url: ''
        };
        this.eventArr = [];
        this.hasOffline = 0;
        // 其他操作触发滚动条到底部
        this.otherOptionScrollBottom = false;
        // 切换用户触发滚动条到底部
        this.changeActiveScrollBottom = false;
        this.windowIsFocus = true;
        this.newMessageNotice = {
            timer: null,
            num: 0
        };
        this.messageTransmit = {
            list: [],
            show: false,
            type: ''
        };
        this.transmitItem = {
            content: {
                msg_type: '',
                from_id: '',
                target_id: ''
            },
            msgKey: -1,
            totalTransmitNum: 0,
            ctime_ms: 0,
            conversation_time_show: '',
            time_show: '',
            hasLoad: false,
            showMoreIcon: false,
            type: 0,
            key: 0,
            isTransmitMsg: true,
            msg_id: 0,
            unread_count: 0,
            msg_type: 0,
            success: 1
        };
        this.verifyModal = {
            info: {},
            show: false
        };
        this.changeOtherInfoFlag = false;
        this.sendBusinessCardCount = 0;
        this.groupAvatar = {
            info: {
                src: '',
                width: 0,
                height: 0,
                pasteFile: {}
            },
            show: false,
            formData: {},
            src: ''
        };
        this.unreadList = {
            show: false,
            info: {
                read: [],
                unread: []
            },
            loading: false
        };
    }
}

import { Component, OnInit, ElementRef, HostListener, OnDestroy } from '@angular/core';
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
            groupSetting: {}
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
        shield: false
    };
    private defaultPanelIsShow = true;
    private otherInfo = {
        show: false,
        info: {}
    };
    private blackMenu = {
        show: false,
        menu: []
    };
    private groupSetting = {
        groupInfo: {
            name: '',
            desc: ''
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
    private selfInfo = {
        avatar: ''
    };
    private isCacheArr = [];
    private storageKey;
    private playVideoShow = {
        show: false,
        url: ''
    };
    private eventArr = [];
    private hasOffline = false;
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
        show: false
    };
    private transmitItem = {
        content: {
            msg_type: ''
        },
        msgKey: -1,
        totalTransmitNum: 0,
        ctime_ms: 0,
        conversation_time_show: ''
    };
    private transmitCount = 0;
    private verifyModal = {
        info: {},
        show: false
    };
    private changeOtherInfoFlag = false;
    constructor(
        private store$: Store<AppStore>,
        private storageService: StorageService,
        private elementRef: ElementRef
    ) {
        this.store$.dispatch({
            type: chatAction.init,
            payload: null
        });
    }
    public ngOnInit() {
        this.subscribeStore();
        this.store$.dispatch({
            type: chatAction.getVoiceState,
            payload: 'voiceState' + global.user
        });
        const that = this;
        global.JIM.onMsgReceive((data) => {
            console.log(data);
            // 群聊消息
            if (data.messages[0].msg_type === 4) {
                that.store$.dispatch({
                    type: chatAction.receiveGroupMessage,
                    payload: {
                        data,
                        conversation: that.conversationList,
                        messageList: that.messageList
                    }
                });
            // 单聊消息
            } else {
                that.store$.dispatch({
                    type: chatAction.receiveSingleMessage,
                    payload: data
                });
            }
        });
        // 异常断线监听
        global.JIM.onDisconnect(() => {
            // 定时器是为了解决火狐下刷新时先弹出断线提示
            setTimeout(() => {
                that.store$.dispatch({
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
            that.asyncEvent(data);
        });
        // 监听离线事件消息
        global.JIM.onSyncEvent((data) => {
            console.log('asyncEvent', data);
            if (!this.isLoaded) {
                that.eventArr = data;
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
            that.hasOffline = true;
            that.store$.dispatch({
                type: chatAction.getAllMessage,
                payload: data
            });
        });
        // 如果3秒内没有加载离线消息则手动触发
        setTimeout(() => {
            if (!that.hasOffline) {
                that.store$.dispatch({
                    type: chatAction.getAllMessage,
                    payload: []
                });
            }
        }, 3000);
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
        console.log(chatState);
        switch (chatState.actionType) {
            case contactAction.getFriendListSuccess:
                this.conversationList = chatState.conversation;
                break;
            case chatAction.getConversationSuccess:
                this.conversationList = chatState.conversation;
                this.messageList = chatState.messageList;
                // 如果是第一次登陆且有离线消息则存储当前msgId
                this.storageKey = 'msgId' + global.user;
                if (chatState.msgId.length > 0 && !this.storageService.get(this.storageKey)) {
                    this.storageMsgId(chatState.msgId);
                }
                if (chatState.isLoaded) {
                    this.isLoaded = chatState.isLoaded;
                    this.isLoadedSubject.next(this.isLoaded);
                }
                this.store$.dispatch({
                    type: chatAction.dispatchConversationList,
                    payload: {
                        messageList: chatState.messageList,
                        conversation: chatState.conversation
                    }
                });
                break;
            case chatAction.receiveMessageSuccess:
                if (chatState.newMessageIsActive) {
                    if (chatState.msgId.length > 0) {
                        this.storageMsgId(chatState.msgId);
                    }
                    this.otherOptionScrollBottom = !this.otherOptionScrollBottom;
                }
                this.messageList = chatState.messageList;
                if (!chatState.newMessageIsDisturb) {
                    this.notification(chatState.newMessage);
                }
                break;
            case chatAction.sendSingleMessage:

            case chatAction.sendGroupMessage:

            case chatAction.sendSinglePic:

            case chatAction.sendGroupPic:

            case chatAction.sendSingleFile:

            case chatAction.sendGroupFile:

            case chatAction.updateGroupMembersEvent:
                // 触发滚动条向下滚动
                this.otherOptionScrollBottom = !this.otherOptionScrollBottom;
                break;
            case chatAction.sendMsgComplete:
                if (chatState.msgId.length > 0) {
                    this.storageMsgId(chatState.msgId);
                }
                break;
            case chatAction.changeActivePerson:
                this.messageList = chatState.messageList;
                this.changeActivePerson(chatState);
                this.defaultPanelIsShow = chatState.defaultPanelIsShow;
                this.storageMsgId(chatState.msgId);
                break;
            case contactAction.selectContactItem:

            case mainAction.selectSearchUser:
                this.messageList = chatState.messageList;
                this.changeActivePerson(chatState);
                this.defaultPanelIsShow = chatState.defaultPanelIsShow;
                this.storageMsgId(chatState.msgId);
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
                this.groupSetting.show = false;
                break;
            case chatAction.watchOtherInfoSuccess:
                this.otherInfo = chatState.otherInfo;
                break;
            case chatAction.hideOtherInfo:
                this.otherInfo = chatState.otherInfo;
                break;
            case  mainAction.createSingleChatSuccess:
                this.otherInfo = chatState.otherInfo;
                break;
            case chatAction.groupSetting:
                this.groupSetting = Object.assign({}, this.groupSetting,
                    messageListActive.groupSetting);
                this.groupSetting.active = this.active;
                break;
            case chatAction.groupInfo:
                this.groupSetting = Object.assign({}, this.groupSetting,
                    messageListActive.groupSetting);
                this.groupSetting.active = this.active;
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
                this.groupSetting.show = false;
                break;
            case mainAction.exitGroupSuccess:
                this.conversationList = chatState.conversation;
                this.defaultPanelIsShow = chatState.defaultPanelIsShow;
                this.groupSetting.show = false;
                break;
            case mainAction.addBlackListSuccess:
                this.conversationList = chatState.conversation;
                this.defaultPanelIsShow = chatState.defaultPanelIsShow;
                break;
            case chatAction.groupDescription:
                this.groupDescription.show = chatState.groupDeacriptionShow;
                this.groupDescription.description = Object.assign({},
                    messageListActive.groupSetting.groupInfo, {});
                break;
            case chatAction.groupName:
                this.groupSetting.groupInfo.name = messageListActive.groupSetting.groupInfo.name;
                this.store$.dispatch({
                    type: chatAction.updateContactInfo,
                    payload: {
                        groupList: chatState.groupList,
                        conversation: chatState.conversation
                    }
                });
                break;
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
            case chatAction.deleteGroupMembersEvent:

            case chatAction.exitGroupEvent:
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
                this.conversationList = chatState.conversation;
                break;
                // 转发消息成功(如果全部成功则为成功，有一个用户失败则不成功，会提示相关信息)
            case chatAction.transmitMessageComplete:
                this.modalTipTransmitSuccess(chatState);
                break;
            case contactAction.agreeAddFriendSuccess:
                this.conversationList = chatState.conversation;
                break;
            case chatAction.showVerifyModal:
                this.verifyModal = chatState.verifyModal;
                break;
            case chatAction.deleteSingleBlackSuccess:

            case mainAction.addSingleNoDisturbSuccess:

            case chatAction.deleteSingleNoDisturbSuccess:

            case chatAction.friendReplyEvent:
                this.otherInfo = chatState.otherInfo;
                this.changeOtherInfoFlag = !this.changeOtherInfoFlag;
                break;
            case chatAction.saveMemoNameSuccess:
                this.conversationList = chatState.conversation;
            case mainAction.deleteFriendSuccess:
                this.store$.dispatch({
                    type: chatAction.dispatchFriendList,
                    payload: chatState.friendList
                });
                this.otherInfo = chatState.otherInfo;
                this.changeOtherInfoFlag = !this.changeOtherInfoFlag;
                break;
            default:
        }
    }
    private modalTipTransmitSuccess (chatState) {
        if (!chatState.transmitSuccess) {
            return;
        }
        this.transmitCount ++;
        if (this.transmitCount === this.transmitItem.totalTransmitNum) {
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
            case 5:
                if (data.extra === 1) {
                    this.store$.dispatch({
                        type: chatAction.friendInvitationEvent,
                        payload: data
                    });
                } else if (data.extra === 2) {
                    this.store$.dispatch({
                        type: chatAction.friendReplyEvent,
                        payload: data
                    });
                }
                this.notification(data);
                break;
            case 8:
                if (data.from_username === '') {
                    this.store$.dispatch({
                        type: chatAction.createGroupEvent,
                        payload: data
                    });
                }
                break;
            case 9:
                if (data.to_usernames[0].username !== global.user) {
                    this.store$.dispatch({
                        type: chatAction.exitGroupEvent,
                        payload: data
                    });
                }
                break;
            case 10:
                this.store$.dispatch({
                    type: chatAction.addGroupMembersEvent,
                    payload: data
                });
                break;
            case 11:
                this.store$.dispatch({
                    type: chatAction.deleteGroupMembersEvent,
                    payload: data
                });
                break;
            case 55:
                // 不考虑离线的消息撤回事件
                if (data.isOffline) {
                    break;
                }
                this.store$.dispatch({
                    type: chatAction.msgRetractEvent,
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
                    body = `${newMessage.from_username}申请添加您为好友`;
                } else if (newMessage.extra === 2) {
                    if (newMessage.description === '') {
                        title = '同意好友申请';
                        body = `${newMessage.from_username}同意了您的好友申请`;
                    } else {
                        title = '拒绝好友申请';
                        body = `${newMessage.from_username}拒绝了您的好友申请`;
                    }
                }
            // 普通消息
            } else {
                if (newMessage.msg_type === 4) {
                    title = newMessage.content.target_name;
                } else {
                    title = newMessage.content.from_name !== '' ?
                            newMessage.content.from_name : newMessage.content.from_id;
                }
                switch (newMessage.content.msg_type) {
                    case 'text':
                        body = newMessage.content.msg_body.text;
                        break;
                    case 'image':
                        body = '[图片]';
                        break;
                    case 'location':
                        body = '[位置]';
                        break;
                    case 'voice':
                        body = '[语音]';
                        break;
                    case 'file':
                        let extras = newMessage.content.msg_body.extras;
                        if (extras && extras.video) {
                            body = '[视频]';
                        } else {
                            body = '[文件]';
                        }
                        break;
                    default:
                        body = '消息';
                }
            }
            Push.create(title, {
                body,
                icon: 'http://7xo28s.com1.z0.glb.clouddn.com/web-jchat/0.0.1/assets/images/favicon.ico',
                timeout: 4000,
                onClick () {
                    window.focus();
                    this.close();
                }
            });
            this.newMessageNotice.num ++;
            clearInterval(this.newMessageNotice.timer);
            this.newMessageNotice.timer = setInterval(() => {
                if (document.title === '极光 IM Demo') {
                    document.title = `jchat(${this.newMessageNotice.num})`;
                } else {
                    document.title = '极光 IM Demo';
                }
                if (this.newMessageNotice.num === 0) {
                    clearInterval(this.newMessageNotice.timer);
                    document.title = '极光 IM Demo';
                }
            }, 1000);
        }
    }
    // 存储消息id(用来计算消息未读数)
    private storageMsgId(msgId) {
        this.storageKey = 'msgId' + global.user;
        this.storageService.set(this.storageKey, JSON.stringify(msgId));
    }
    // 更新当前对话用户信息
    private changeActivePerson(chatState) {
        this.active = chatState.activePerson;
        this.changeActiveScrollBottom = !this.changeActiveScrollBottom;
        this.groupSetting.show = false;
        // 判断是否已经缓存
        if (this.isCacheArr.indexOf(this.active.key) === -1 &&
            this.messageList[this.active.activeIndex].msgs.length > 0) {
            this.isCacheArr.push(this.active.key);
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
        if (Number(this.active.key) === Number(item.key)) {
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
    private sendMsgEmit(data) {
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
                    text: data.content
                }
            },
            ctime_ms: new Date().getTime(),
            success: 1,
            msgKey: this.msgKey ++
        };
        // 发送单聊消息
        if (this.active.type === 3 && !data.repeatSend) {
            let singleMsg = {
                target_username: this.active.name,
                // target_nickname: this.active.nickName,
                content: data.content
            };
            msgs.singleMsg = singleMsg;
            msgs.msg_type = 3;
            this.store$.dispatch({
                type: chatAction.sendSingleMessage,
                payload: {
                    singleMsg,
                    key: this.active.key,
                    msgs
                }
            });
            // 发送群组消息
        }else if (this.active.type === 4 && !data.repeatSend) {
            let groupMsg = {
                target_gid: this.active.key,
                // target_gname: this.active.name,
                content: data.content
            };
            msgs.groupMsg = groupMsg;
            msgs.msg_type = 4;
            this.store$.dispatch({
                type: chatAction.sendGroupMessage,
                payload: {
                    groupMsg,
                    key: this.active.key,
                    msgs
                }
            });
        }else if (this.active.type === 3 && data.repeatSend) {
            this.store$.dispatch({
                type: chatAction.sendSingleMessage,
                payload: {
                    singleMsg: data.singleMsg,
                    key: this.active.key,
                    msgs: data
                }
            });
        }else if (this.active.type === 4 && data.repeatSend) {
            this.store$.dispatch({
                type: chatAction.sendGroupMessage,
                payload: {
                    groupMsg: data.groupMsg,
                    key: this.active.key,
                    msgs: data
                }
            });
        }
    }
    // 发送图片消息
    private sendPicEmit(data) {
        let msgs;
        const that = this;
        const file = this.elementRef.nativeElement.querySelector('#sendPic');
        // repeatSend = true重发消息
        if (data.repeatSend && this.active.type === 3) {
            that.store$.dispatch({
                type: chatAction.sendSinglePic,
                payload: {
                    singlePicFormData: data.singlePicFormData,
                    key: that.active.key,
                    msgs: data
                }
            });
            return ;
        }else if (data.repeatSend && this.active.type === 4) {
            that.store$.dispatch({
                type: chatAction.sendGroupPic,
                payload: {
                    groupPicFormData: data.groupPicFormData,
                    key: that.active.key,
                    msgs: data
                }
            });
            return ;
        }
        // 粘贴图片发送
        if (data.type === 'paste') {
            this.sendPicContent(msgs, data.info, data.img, that);
        // 正常发送图片
        } else {
            this.util.imgReader(file, () => {
                that.store$.dispatch({
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
                this.sendPicContent(msgs, value, data.img, that);
            });
        }
    }
    private sendPicContent(msgs, value, data, that) {
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
            msgKey: that.msgKey ++
        };
        // 发送单聊图片
        if (that.active.type === 3) {
            let singlePicFormData = {
                target_username: that.active.name,
                // target_nickname: that.active.nickName,
                appkey: authPayload.appKey,
                image: data
            };
            msgs.singlePicFormData = singlePicFormData;
            msgs.msg_type = 3;
            that.store$.dispatch({
                type: chatAction.sendSinglePic,
                payload: {
                    singlePicFormData,
                    key: that.active.key,
                    msgs
                }
            });
        // 发送群聊图片
        }else if (that.active.type === 4) {
            let groupPicFormData = {
                target_gid: that.active.key,
                // target_gname: that.active.name,
                image: data
            };
            msgs.groupPicFormData = groupPicFormData;
            msgs.msg_type = 4;
            that.store$.dispatch({
                type: chatAction.sendGroupPic,
                payload: {
                    groupPicFormData,
                    key: that.active.key,
                    msgs
                }
            });
        }
    }
    private sendFileEmit(data) {
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
                msgKey: this.msgKey ++
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
                }
            };
            msgs.singleFile = singleFile;
            msgs.msg_type = 3;
            this.store$.dispatch({
                type: chatAction.sendSingleFile,
                payload: {
                    key: this.active.key,
                    msgs,
                    singleFile
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
                }
            };
            msgs.groupFile = groupFile;
            msgs.msg_type = 4;
            this.store$.dispatch({
                type: chatAction.sendGroupFile,
                payload: {
                    key: this.active.key,
                    msgs,
                    groupFile
                }
            });
        }else if (this.active.type === 3 && data.repeatSend) {
            this.store$.dispatch({
                type: chatAction.sendSingleFile,
                payload: {
                    key: this.active.key,
                    msgs: data,
                    singleFile: data.singleFile
               }
            });
        }else if (this.active.type === 4 && data.repeatSend) {
            this.store$.dispatch({
                type: chatAction.sendGroupFile,
                payload: {
                    key: this.active.key,
                    msgs: data,
                    groupFile: data.groupFile
                }
            });
        }
    }
    // 保存草稿
    private saveDraftEmit(tempArr) {
        this.store$.dispatch({
            type: chatAction.saveDraft,
            payload: tempArr
        });
    }
    // 查看用户个人信息
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
        if (item && Number(item.key) !== Number(this.active.key)) {
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
        this.store$.dispatch({
            type: chatAction.groupSetting,
            payload: {
                active: this.active,
                show: true,
                // 是否已经请求过
                isCache: this.messageList[this.active.activeIndex].groupSetting
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
                        title: '添加消息免打扰',
                        tip: `确定将 ${otherInfo.nickname || otherInfo.username} 加入消息免打扰吗？`,
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
    // 转发消息弹窗显示
    private msgTransmitEmit(item) {
        this.messageTransmit.list = this.conversationList;
        this.messageTransmit.show = true;
        this.transmitItem = item;
    }
    // 转发弹窗搜索
    private searchMessageTransmitEmit(keywords) {
        this.store$.dispatch({
            type: chatAction.searchMessageTransmit,
            payload: keywords
        });
    }
    // 转发消息
    private confirmTransmitEmit(select) {
        console.log(7777, select);
        this.transmitItem.msgKey = this.msgKey ++;
        this.transmitItem.totalTransmitNum = select.length;
        this.transmitItem.ctime_ms = new Date().getTime();
        this.transmitItem.conversation_time_show = 'today';
        this.transmitCount = 0;
        for (let item of select) {
            let data = {
                select: item,
                msgs: this.transmitItem
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
        if (verifyModalText) {
            let userInfo = Object.assign({}, this.verifyModal.info, {verifyModalText});
            this.store$.dispatch({
                type: chatAction.addFriendConfirm,
                payload: userInfo
            });
        }
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
}

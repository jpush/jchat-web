import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';

import { global, authPayload, StorageService } from '../../services/common';
import { AppStore } from '../../app.store';
import { mainAction } from './actions';
import { contactAction } from '../contact/actions';
import { chatAction } from '../chat/actions';
import { md5 } from '../../services/tools';

import { Util } from '../../services/util';

const avatarErrorIcon = '../../../assets/images/single-avatar.svg';

@Component({
    selector: 'app-main',
    styleUrls: ['./main.component.scss'],
    templateUrl: './main.component.html'
})
export class MainComponent implements OnInit, OnDestroy {
    private util: Util = new Util();
    private mainStream$;
    private global = global;
    private listTab = 0;
    private self: any = {
        show: false,
        info: {
            avatarUrl: ''
        }
    };
    private createGroup = {
        show: false,
        list: []
    };
    private islogoutShow = false;
    private isModifyPasswordShow = false;
    private searchUserResult = {
        isSearch: false,
        result: {
            singleArr: [],
            groupArr: []
        }
    };
    private tipModal = {
        show: false,
        info: {
            title: '',
            tip: ''
        }
    };
    private createSingleChat = {
        show: false,
        info: ''
    };
    private blackMenu = {
        show: false,
        menu: []
    };
    private chatMenu = {
        show: false,
        info: [
            {
                key: 0,
                name: '发起单聊'
            },
            {
                key: 1,
                name: '发起群聊'
            },
            {
                key: 2,
                name: '添加好友'
            }
        ]
    };
    private settingMenu = {
        show: false,
        info: [
            {
                key: 0,
                name: '修改密码'
            },
            {
                key: 1,
                name: '黑名单列表'
            },
            {
                key: 2,
                name: '退出登录'
            }
        ]
    };
    private conversationHover = {
        tip: '会话',
        position: {
            left: 56,
            top: 4
        },
        show: false
    };
    private contactHover = {
        tip: '通讯录',
        position: {
            left: 56,
            top: 4
        },
        show: false
    };
    private createHover = {
        tip: '创建',
        position: {
            left: 56,
            top: 4
        },
        show: false
    };
    private moreHover = {
        tip: '更多',
        position: {
            left: 56,
            top: 4
        },
        show: false
    };
    private logoutKick = {
        show: false,
        info: {
            title: '',
            tip: ''
        }
    };
    private badge = {
        conversation: 0,
        contact: 0
    };
    private createSingleOption = {
        title: '发起单聊',
        placeholder: '输入用户名查找'
    };
    constructor(
        private store$: Store<AppStore>,
        private storageService: StorageService,
        private router: Router
    ) {
        // 避免频繁切换用户时，store的数据依然还保留上一用户的状态
        this.store$.dispatch({
            type: mainAction.init,
            payload: null
        });
    }
    public ngOnInit() {
        this.subscribeStore();
        this.store$.dispatch({
            type: mainAction.getSelfInfo,
            payload: null
        });
        this.store$.dispatch({
            type: mainAction.blackMenu,
            payload: {
                show: false
            }
        });
    }
    public ngOnDestroy() {
        this.mainStream$.unsubscribe();
    }
    @HostListener('window:click') private onClickWindow() {
        this.settingMenu.show = false;
        this.chatMenu.show = false;
    }
    // 关闭窗口时存cookie，五分钟之内进入页面还可以免登陆
    @HostListener('window:beforeunload') private onBeforeunloadWindow() {
        let time = 5 * 60 * 1000;
        this.storageService.set(md5('afterFiveMinutes-username'), global.user, true, time);
        this.storageService.set(md5('afterFiveMinutes-password'), global.password, true, time);
    }
    private avatarErrorIcon(event) {
        event.target.src = avatarErrorIcon;
    }
    private subscribeStore() {
        this.mainStream$ = this.store$.select((state) => {
            const mainState = state['mainReducer'];
            const contactState = state['contactReducer'];
            this.stateChanged(mainState, contactState);
            return state;
        }).subscribe((state) => {
            // pass
        });
    }
    private stateChanged(mainState, contactState) {
        switch (mainState.actionType) {
            case contactAction.selectContactItem:
                this.listTab = mainState.listTab;
                break;
            case mainAction.showSelfInfo:
                if (mainState.selfInfo.info) {
                    this.self.info = mainState.selfInfo.info;
                }
                this.self.show = mainState.selfInfo.show;
                break;
            case mainAction.changeListTab:
                this.listTab = mainState.listTab;
                if (this.listTab === 0) {
                    this.badge.conversation = 0;
                } else {
                    this.badge.contact = 0;
                }
                break;
            case mainAction.createGroupShow:
                this.createGroup = mainState.createGroup;
                this.createGroup.list = contactState.friendList;
                break;
            case mainAction.createGroupSuccess:
                this.listTab = mainState.listTab;
                this.createGroup = mainState.createGroup;
                break;
            case mainAction.modifyPasswordShow:
                this.isModifyPasswordShow = mainState.modifyPasswordShow.show;
                if (mainState.modifyPasswordShow.repeatLogin !== '') {
                    this.repeatLogin(mainState);
                }
                break;
            case chatAction.searchUserSuccess:
                this.searchUserResult =  mainState.searchUserResult;
                break;
            case mainAction.selectSearchUser:
                this.listTab = mainState.listTab;
                this.searchUserResult = mainState.searchUserResult;
                break;
            case mainAction.hideModalTip:

            case mainAction.showModalTip:

            case mainAction.deleteMemberSuccess:

            case mainAction.exitGroupSuccess:
                this.tipModal = mainState.tipModal;
                break;
            case mainAction.createSingleChatShow:
                this.createSingleChat = mainState.createSingleChat;
                break;
            case mainAction.createSingleChatSuccess:
                this.createSingleChat = mainState.createSingleChat;
                this.listTab = mainState.listTab;
                break;
            case mainAction.emptySingleChatTip:
                this.createSingleChat.info = mainState.createSingleChat.info;
                break;
            case mainAction.blackMenuSuccess:
                this.blackMenu = mainState.blackMenu;
                break;
            case mainAction.hideBlackMenu:
                this.blackMenu = mainState.blackMenu;
                break;
            case mainAction.delSingleBlack:
                this.blackMenu = mainState.blackMenu;
                break;
            case mainAction.delSingleBlackSuccess:
                this.blackMenu = mainState.blackMenu;
                break;
            case mainAction.logoutKickShow:
                this.logoutKick = mainState.logoutKick;
                break;
            case chatAction.dispatchMessageUnread:
                if (this.listTab === 1) {
                    this.badge.conversation ++;
                }
                break;
            case contactAction.dispatchContactUnreadNum:
                this.badge.contact = mainState.contactUnreadNum;
                break;
            case chatAction.createOtherChat:
                this.listTab = mainState.listTab;
                break;
            default:
        }
    }
    // 修改密码后重新登录
    private repeatLogin(mainState) {
        global.password = mainState.modifyPasswordShow.repeatLogin;
        const time = 5 * 60 * 1000;
        const usernameKey = md5('afterFiveMinutes-username');
        const passwordKey = md5('afterFiveMinutes-password');
        this.storageService.set(usernameKey, global.user, true, time);
        this.storageService.set(passwordKey, global.password, true, time);
        this.store$.dispatch({
            type: mainAction.login,
            payload: {
                username: global.user,
                password: global.password,
                md5: true
            }
        });
    }
    // 切换聊天面板和联系人面板
    private changeListTab(index) {
        this.store$.dispatch({
            type: mainAction.changeListTab,
            payload: index
        });
    }
    // 获取个人信息
    private getSelfInfo(event) {
        this.store$.dispatch({
            type: mainAction.showSelfInfo,
            payload: {
                show: true
            }
        });
    }
    // 个人信息模态框里传递的事件
    private selfInfoEmit(newInfo) {
        if (!newInfo) {
            this.store$.dispatch({
                type: mainAction.showSelfInfo,
                payload: {
                    show: false
                }
            });
        }
        if (newInfo && newInfo.info) {
            this.store$.dispatch({
                type: mainAction.updateSelfInfo,
                payload: newInfo.info
            });
        }
        if (newInfo && newInfo.avatar.url) {
            this.store$.dispatch({
                type: mainAction.updateSelfAvatar,
                payload: newInfo.avatar
            });
        }
    }
    // 创建群聊
    private createGroupEmit(info) {
        if (info && info.add) {
            this.store$.dispatch({
                type: mainAction.addGroupMember,
                payload: info
            });
        } else if (info && !info.add) {
            this.store$.dispatch({
                type: mainAction.createGroup,
                payload: info
            });
        } else {
            this.store$.dispatch({
                type: mainAction.createGroupShow,
                payload: {
                    show: false,
                    info: {}
                }
            });
        }
    }
    // 修改密码
    private modifyPasswordEmit(info) {
        if (info) {
            this.store$.dispatch({
                type: mainAction.modifyPassword,
                payload: info
            });
        } else {
            this.store$.dispatch({
                type: mainAction.modifyPasswordShow,
                payload: {
                    repeatLogin: '',
                    show: false
                }
            });
        }
    }
    // 搜索keyup事件
    private searchUserEmit(searchInfo) {
        this.store$.dispatch({
            type: mainAction.searchUser,
            payload: searchInfo
        });
    }
    // 点击搜索结果
    private selectUserResultEmit(item) {
        if (item.gid) {
            item.group = true;
            item.type = 4;
            item.key = item.gid;
        }
        this.store$.dispatch({
            type: mainAction.selectSearchUser,
            payload: item
        });
    }
    // 创建单聊/添加好友模态框确定取消按钮
    private createSingleChatEmit(info) {
        // 点击取消
        if (!info) {
            this.store$.dispatch({
                type: mainAction.createSingleChatShow,
                payload: {
                    show: false,
                    info: ''
                }
            });
        // 点击确定 输入为空
        } else if (info.singleName === '') {
            const text = info.type === 'addFriend' ? '请输入要添加好友的用户名' : '请输入要单聊的用户名';
            this.store$.dispatch({
                type: mainAction.createSingleChatShow,
                payload: {
                    show: true,
                    info: text
                }
            });
        // 点击确定 如果单聊搜索到自己
        } else if (info.singleName === global.user) {
            this.store$.dispatch({
                type: mainAction.showSelfInfo,
                payload: {
                    show: true
                }
            });
            this.store$.dispatch({
                type: mainAction.createSingleChatShow,
                payload: {
                    show: false,
                    info: ''
                }
            });
        // 点击确定
        } else if (info.singleName) {
            this.store$.dispatch({
                type: mainAction.createSingleChatAction,
                payload: info
            });
        }
    }
    // 清空单聊模态框错误提示
    private emptySingleChatTipEmit() {
        this.store$.dispatch({
            type: mainAction.emptySingleChatTip,
            payload: {
                info: ''
            }
        });
    }
    // 点击黑名单模态框确定按钮
    private blackMenuConfirmEmit() {
        this.store$.dispatch({
            type: mainAction.hideBlackMenu,
            payload: {
                menu: [],
                show: false
            }
        });
    }
    // 加入黑名单列表
    private delSingleBlackEmit(user) {
        this.store$.dispatch({
            type: mainAction.delSingleBlack,
            payload: user
        });
    }
    private modalTipEmit(info) {
        // 模态框点击确定按钮
        if (info) {
            switch (info.actionType) {
                case '[main] logout show':
                    this.store$.dispatch({
                        type: mainAction.logoutAction,
                        payload: null
                    });
                    break;
                case '[chat] add black list':
                    this.store$.dispatch({
                        type: mainAction.addBlackListAction,
                        payload: info.active
                    });
                    break;
                case '[chat] exit group':
                    this.store$.dispatch({
                        type: mainAction.exitGroupAction,
                        payload: info.groupInfo.gid
                    });
                    break;
                case '[chat] delete member':
                    this.store$.dispatch({
                        type: mainAction.deleteMemberAction,
                        payload: {
                            deleteItem: info.deleteItem,
                            group: info.group
                        }
                    });
                    break;
                case '[chat] add single no disturb modal':
                    this.store$.dispatch({
                        type: mainAction.addSingleNoDisturbAction,
                        payload: info.active
                    });
                    break;
                case '[chat] delete friend modal':
                    this.store$.dispatch({
                        type: mainAction.deleteFriend,
                        payload: info.active
                    });
                    break;
                default:
                    this.store$.dispatch({
                        type: mainAction.hideModalTip,
                        payload: {
                            show: false,
                            info: {}
                        }
                    });
            }
        // 模态框点击取消按钮
        } else {
            this.store$.dispatch({
                type: mainAction.hideModalTip,
                payload: {
                    show: false,
                    info: {}
                }
            });
        }
    }
    // 点击左下角 创建按钮
    private chatMenuShow(event) {
        event.stopPropagation();
        this.settingMenu.show = false;
        if (this.chatMenu.show === true) {
            this.chatMenu.show = false;
        } else {
            this.chatMenu.show = true;
        }
    }
    private selectChatMenuItemEmit(item) {
        let type = '';
        switch (item.key) {
            case 0:
                type = mainAction.createSingleChatShow;
                this.createSingleOption = {
                    title: '发起单聊',
                    placeholder: '输入用户名查找'
                };
                break;
            case 1:
                type = mainAction.createGroupShow;
                break;
            case 2:
                type = mainAction.createSingleChatShow;
                this.createSingleOption = {
                    title: '添加好友',
                    placeholder: '输入用户名'
                };
                break;
            default:
        }
        this.store$.dispatch({
            type,
            payload: {
                show: true,
                info: item.key !== 1 ? '' : {}
            }
        });
        this.chatMenu.show = false;
    }
    // 点击左下角设置按钮
    private settingMenuShow(event) {
        event.stopPropagation();
        this.chatMenu.show = false;
        if (this.settingMenu.show === true) {
            this.settingMenu.show = false;
        } else {
            this.settingMenu.show = true;
        }
    }
    private selectSettingItemEmit(item) {
        switch (item.key) {
            case 0:
                this.store$.dispatch({
                    type: mainAction.modifyPasswordShow,
                    payload: {
                        repeatLogin: '',
                        show: true
                    }
                });
                break;
            case 1:
                this.store$.dispatch({
                    type: mainAction.blackMenu,
                    payload: {
                        show: true
                    }
                });
                break;
            case 2:
                // 展示全局的模态框
                this.store$.dispatch({
                    type: mainAction.showModalTip,
                    payload: {
                        show: true,
                        info: {
                            title: '退出',          // 模态框标题
                            tip: '确定要退出web jchat吗？',   // 模态框内容
                            actionType: '[main] logout show'// 哪种操作，点击确定时可以执行对应操作
                            // success: 1 / 2               // 成功的提示框/失败的提示框，1.5s后会自动消失
                        }
                    }
                });
                break;
            default:
        }
        this.settingMenu.show = false;
    }
    private avatarLoad(event) {
        if (event.target.naturalHeight > event.target.naturalWidth) {
            event.target.style.width = '100%';
            event.target.style.height = 'auto';
        } else {
            event.target.style.height = '100%';
            event.target.style.width = 'auto';
        }
    }
    // 被其他设备登录踢
    private logoutKickEmit(info) {
        // 重新登录
        if (info) {
            this.store$.dispatch({
                type: mainAction.login,
                payload: {
                    username: global.user,
                    password: global.password,
                    md5: true,
                    reload: true
                }
            });
        // 去登录页面
        } else {
            this.router.navigate(['/login']);
        }
    }
    // 选择的不是图片
    private selectIsNotImageEmit() {
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
}

import { mainAction } from '../actions';
import { MainStore } from '../stores';
import { mainInit } from '../model';
import { contactAction } from '../../contact/actions';
import { chatAction } from '../../chat/actions';
import { Util } from '../../../services/util';
export const mainReducer = (state: MainStore = mainInit, {type, payload}) => {
    state.actionType = type;
    switch (type) {
            // 初始化state
        case mainAction.init:
            state = Util.deepCopyObj(mainInit);
            break;
            // 成功获取个人信息
        case mainAction.showSelfInfo:
            // 获取个人信息成功或失败
            if (payload.info) {
                state.selfInfo.info = Object.assign({}, state.selfInfo.info , payload.info);
            }
            if (payload.avatar) {
                state.selfInfo.info.avatarUrl = payload.avatar.url;
            }
            if (!payload.info && !payload.avatar && payload.show !== undefined) {
                state.selfInfo.show = payload.show;
            }
            state.selfInfo.loading = payload.loading;
            break;
            // 更新自己的个人资料
        case mainAction.updateSelfInfo:
            state.selfInfo.loading = true;
            break;
            // 切换好友或者最近列表
        case mainAction.changeListTab:
            state.listTab = payload;
            break;
            // 点击选择联系人中的用户
        case contactAction.selectContactItem:
            state.listTab = 0;
            break;
            // 是否显示创建群组模块
        case mainAction.createGroupShow:
            state.createGroup = payload;
            break;
            // 创建群组成功
        case mainAction.createGroupSuccess:
            state.createGroup.show = false;
            state.listTab = 0;
            break;
            // 显示创建群聊第二步
        case mainAction.createGroupNextShow:
            state.createGroupNext.show = payload.show;
            state.createGroupNext.display = payload.display;
            if (payload.info) {
                state.createGroupNext.info = payload.info;
            }
            break;
            // 显示加入公开群的模态框
        case mainAction.enterPublicGroupShow:
            state.enterPublicGroup = payload;
            break;
            // 搜索公开群成功
        case mainAction.searchPublicGroupSuccess:
            state.groupInfo = payload;
            state.enterPublicGroup = {
                show: false,
                info: {}
            };
            break;
            // 显示发送群组验证信息模态框
        case mainAction.groupVerifyModal:
            state.groupVerifyModal.show = payload.show;
            break;
            // 添加群成员成功
        case mainAction.addGroupMemberSuccess:
            state.createGroup.show = false;
            state.listTab = 0;
            break;
            // 修改密码
        case mainAction.modifyPasswordShow:
            state.modifyPasswordShow = payload;
            break;
            // 搜索本地用户成功
        case chatAction.searchUserSuccess:
            state.searchUserResult = payload;
            break;
            // 选择搜索出来的联系人或者群组用户
        case mainAction.selectSearchUser:
            state.listTab = 0;
            state.searchUserResult = {
                result: {
                    groupArr: [],
                    singleArr: [],
                    roomArr: []
                },
                isSearch: false
            };
            break;
            // 选择搜索出来的聊天室
        case mainAction.selectSearchRoomUser:
            state.listTab = 2;
            state.searchUserResult = {
                result: {
                    groupArr: [],
                    singleArr: [],
                    roomArr: []
                },
                isSearch: false
            };
            break;
            // 提示框
        case mainAction.showModalTip:

        case mainAction.hideModalTip:
            // 成功加入黑名单列表
        case mainAction.addBlackListSuccess:
            // 退群成功
        case mainAction.exitGroupSuccess:
            // 删除群成员成功
        case mainAction.deleteMemberSuccess:
            state.tipModal = payload;
            break;
            // 显示创建单聊模态框
        case mainAction.createSingleChatShow:
            state.createSingleChat = payload;
            break;
            // 创建单聊成功
        case mainAction.createSingleChatSuccess:
            state.createSingleChat = {
                show: false,
                info: ''
            };
            break;
            // 对方资料中发起聊天
        case chatAction.createOtherChat:
            state.listTab = 0;
            break;
            // 清除单聊模态框的提示信息
        case mainAction.emptySingleChatTip:
            state.createSingleChat.info = payload.info;
            break;
            // 成功获取黑名单列表
        case mainAction.blackMenuSuccess:
            if (payload.show !== null) {
                state.blackMenu.show = payload.show;
            }
            filterBlackMenuMemoName(state, payload.menu);
            state.blackMenu.menu = payload.menu;
            break;
            // 隐藏黑名单列表
        case mainAction.hideBlackMenu:
            state.blackMenu = payload;
            break;
            // 删除黑名单列表
        case mainAction.delSingleBlack:
            delSingleBlackLoading(state, payload, true);
            break;
            // 删除黑名单列表成功
        case mainAction.delSingleBlackSuccess:
            delSingleBlackLoading(state, payload, false);
            break;
            // 被其他设备登录踢掉的提示
        case mainAction.logoutKickShow:
            state.logoutKick = payload;
            break;
            // 传递联系人和会话tab的未读数
        case contactAction.dispatchContactUnreadNum:
            state.contactUnreadNum = payload;
            break;
            // 传递通讯录未读数
        case chatAction.dispatchConversationUnreadNum:
            state.conversationUnreadNum = payload;
            break;
            // 传递好友列表
        case chatAction.dispatchFriendList:
            state.friendList = payload;
            break;
        case chatAction.changeHideAll:
            state.listTab = payload;
            break;
        default:
    }
    return state;
};
// 为黑名单列表添加备注名
function filterBlackMenuMemoName(state: MainStore, payload) {
    for (let black of payload) {
        for (let friend of state.friendList) {
            if (friend.username === black.username && friend.appkey === black.appkey &&
                friend.memo_name && friend.memo_name !== '') {
                black.memo_name = friend.memo_name;
                break;
            }
        }
    }
}
// 切换删除黑名单列表的loading状态
function delSingleBlackLoading(state: MainStore, payload, loadingValue) {
    for (let black of state.blackMenu.menu) {
        if (black.username === payload.username) {
            black.loading = loadingValue;
            break;
        }
    }
}

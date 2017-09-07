import { mainAction } from '../actions';
import { MainStore } from '../stores/main.store';
import { mainInit } from '../model';
import { contactAction } from '../../contact/actions';
import { chatAction } from '../../chat/actions';

export const mainReducer = (state: MainStore = mainInit, {type, payload}) => {
    state.actionType = type;
    switch (type) {
            // 初始化state
        case mainAction.init:
            state = Object.assign({}, mainInit, {});
            break;
            // 成功获取个人信息
        case mainAction.showSelfInfo:
            if (payload.show !== 'undefined') {
                state.selfInfo.show = payload.show;
            }
            // 获取个人信息成功
            if (payload.info) {
                state.selfInfo.info = Object.assign({}, state.selfInfo.info , payload.info);
            }
            if (payload.avatar) {
                state.selfInfo.info.avatarUrl = payload.avatar.url;
            }
            break;
            // 切换好友或者最近列表
        case mainAction.changeListTab:
            state.listTab = payload;
            break;
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
            // 选择搜索出来的本地用户
        case mainAction.selectSearchUser:
            state.listTab = 0;
            state.searchUserResult = {
                result: {
                    groupArr: [],
                    singleArr: []
                },
                isSearch: false
            };
            break;
            // 提示框
        case mainAction.showModalTip:

        case mainAction.hideModalTip:

        case mainAction.addBlackListSuccess:

        case mainAction.exitGroupSuccess:

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
            // state.listTab = 0;
            break;
        case chatAction.createOtherChat:
            state.listTab = 0;
            break;
            // 清除单聊模态框的提示信息
        case mainAction.emptySingleChatTip:
            state.createSingleChat.info = payload.info;
            break;
            // 创建群聊搜索联系人
        case mainAction.createGroupSearchComplete:
            state.createGroupSearch.info = payload;
            break;
            // 成功获取黑名单列表
        case mainAction.blackMenuSuccess:
            state.blackMenu = payload;
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
        case contactAction.dispatchContactUnreadNum:
            state.contactUnreadNum = payload;
            break;
        default:
    }
    return state;
};
// 切换删除黑名单列表的loading状态
function delSingleBlackLoading(state, payload, loadingValue) {
    for (let black of state.blackMenu.menu) {
        if (black.username === payload.username) {
            black.loading = loadingValue;
            break;
        }
    }
}

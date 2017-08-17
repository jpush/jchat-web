import { contactAction } from '../actions';
import { ContactStore } from '../stores/contact.store';
import { contactInit } from '../model';
import { mainAction } from '../../main/actions';
import { chatAction } from '../../chat/actions';
import { Util } from '../../../services/util';
let util = new Util();
import { global } from '../../../services/common';

export const contactReducer = (state: ContactStore = contactInit, {type, payload}) => {
    state.actionType = type;
    switch (type) {
            // 初始化state
        case contactAction.init:
            state = Object.assign({}, contactInit, {});
            break;
        case chatAction.dispatchConversationList:
            state.messageList = payload.messageList;
            state.conversation = payload.conversation;
            if (state.hasNoSortFriendList.length > 0 && !state.hasConversation) {
                filterConversation(state);
                state.friendList = util.sortByLetter(state.hasNoSortFriendList);
            }
            state.hasConversation = true;
            break;
            // 成功获取群列表
        case contactAction.getGroupListSuccess:
            state.groupList = util.sortByLetter(payload);
            break;
            // 创建群聊事件
        case chatAction.createGroupSuccessEvent:
            // 创建群组
        case mainAction.createGroupSuccess:
            state.groupList = util.insertSortByLetter(state.groupList, payload);
            break;
        case contactAction.getFriendListSuccess:
            state.hasNoSortFriendList = payload;
            if (state.hasConversation) {
                filterConversation(state);
                state.friendList = util.sortByLetter(payload);
            }
            break;
            // 退群成功
        case mainAction.exitGroupSuccess:
            exitGroup(state, payload);
            break;
            // 删除本地会话
        case chatAction.deleteConversationItem:
            addInfoToContact(state, payload);
            break;
            // 修改群名称后重新排序
        case chatAction.updateContactInfo:
            state.groupList = util.sortByLetter(payload.groupList);
            break;
        default:
    }
    return state;
};
// 补全好友的key
function filterConversation(state) {
    for (let friend of state.hasNoSortFriendList) {
        let flag = true;
        friend.name = friend.username;
        friend.nickName = friend.nickname;
        delete friend.username;
        delete friend.nickname;
        for (let item of state.conversation) {
            if (item.type === 3 && item.name === friend.name) {
                flag = false;
                friend.key = item.key;
                break;
            }
        }
        if (flag) {
            friend.key = --global.conversationKey;
            state.messageList.push({
                key: global.conversationKey,
                msgs: []
            });
        }
    }
}
// 退出群聊时删除群组列表
function exitGroup(state, payload) {
    for (let group of state.groupList) {
        for (let j = 0; j < group.data.length; j++) {
            if (Number(payload.item.key) === Number(group.data[j].gid)) {
                group.data.splice(j, 1);
                break;
            }
        }
    }
}
// 删除会话时将会话的信息转移到群或者好友
function addInfoToContact(state, payload) {
    for (let group of state.groupList){
        for (let j = 0; j < group.data.length; j++) {
            let itemKey = payload.item.key ? payload.item.key : payload.item.gid;
            let flag = Number(group.data[j].gid) === Number(itemKey);
            if (flag) {
                group.data[j] = Object.assign({}, group.data[j], payload.item);
                return;
            }
        }
    }
    for (let friend of state.friendList) {
        for (let i = 0; i < friend.data.length; i++) {
            if (Number(payload.item.key) === Number(friend.data[i].key)) {
                friend.data[i] = Object.assign({}, friend.data[i], payload.item);
                return ;
            }
        }
    }
}
// 判断是否已经存在这个单聊
function isSingleExist(state, payload) {
    for (let conversation of state.friendList) {
        for (let item of conversation) {
            if (Number(item.key) === Number(payload.key)) {
                return true;
            }
        }
    }
    return false;
}

import { contactAction } from '../actions';
import { ContactStore } from '../stores/contact.store';
import { contactInit } from '../model';
import { mainAction } from '../../main/actions';
import { chatAction } from '../../chat/actions';
import { Util } from '../../../services/util';
let util = new Util();

export const contactReducer = (state: ContactStore = contactInit, {type, payload}) => {
    state.actionType = type;
    switch (type) {
            // 初始化state
        case contactAction.init:
            state = Object.assign({}, contactInit, {});
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
            state.conversation = flagGroup(util.insertSortByLetter(state.conversation, payload));
            break;
            // 从chatState获取conversation
        case chatAction.dispatchConversationList:
            state.conversation = flagGroup(util.sortByLetter(payload));
            break;
            // 接收消息
        case chatAction.receiveMessageSuccess:
            addStranger(state, payload);
            break;
            // 创建单聊成功
        case mainAction.createSingleChatSuccess:
            if (!isSingleExist(state, payload)) {
                state.conversation =
                    flagGroup(util.insertSortByLetter(state.conversation, payload));
            }
            break;
            // 退群成功
        case mainAction.exitGroupSuccess:
            exitGroup(state, payload);
            break;
            // 删除本地会话
        case chatAction.deleteConversationItem:
            addInfoToGroup(state, payload);
            break;
            // 修改群名称后重新排序
        case chatAction.updateContactInfo:
            state.groupList = util.sortByLetter(payload.groupList);
            state.conversation = flagGroup(util.sortByLetter(payload.conversation));
            break;
        default:
    }
    return state;
};
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
// 陌生人发消息给自己将其添加到联系人中
function addStranger(state, payload) {
    for (let message of payload.messages) {
        let flag = false;
        for (let conversation of state.conversation) {
            for (let item of conversation.data) {
                let conversationKey = Number(item.key);
                let messageKey = Number(message.from_uid);
                let singleFlag = (message.msg_type === 3 && (conversationKey === messageKey));
                if (singleFlag) {
                    flag = true;
                    break;
                }
            }
        }
        // 单聊
        if (!flag) {
            message.name = message.content.from_id;
            message.type = 3;
            message.avatarUrl = message.content.avatarUrl;
            message.key = message.from_uid;
            state.conversation =
                flagGroup(util.insertSortByLetter(state.conversation, message));
        }
    }
}
// 删除会话时将会话的信息转移到群
function addInfoToGroup(state, payload) {
    for (let group of state.groupList){
        for (let j = 0; j < group.data.length; j++) {
            let flag = Number(group.data[j].gid) === Number(payload.item.key) ||
                        Number(group.data[j].gid) === Number(payload.item.gid);
            if (flag) {
                group.data[j] = Object.assign({}, group.data[j], payload.item);
                break;
            }
        }
    }
}
// 判断是否已经存在这个单聊
function isSingleExist(state, payload) {
    for (let conversation of state.conversation) {
        for (let item of conversation) {
            if (Number(item.key) === Number(payload.key)) {
                return true;
            }
        }
    }
    return false;
}
// 判断某字母是否全是群组的数据
function flagGroup(payload) {
    for (let payItem of payload) {
        if (payItem.data.length > 0) {
            let flag = true;
            for (let dataItem of payItem.data) {
                if (dataItem.type === 3) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                payItem.allGroup = true;
            }else {
                payItem.allGroup = false;
            }
        }
    }
    return payload;
}

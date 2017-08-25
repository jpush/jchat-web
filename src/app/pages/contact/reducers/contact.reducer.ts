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
            console.log('friendList', payload[0].name);
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
        case mainAction.changeListTab:
            state.listTab = payload;
            if (payload === 1) {
                state.contactUnreadNum = 0;
                if (state.tab === 0) {
                    state.verifyUnreadNum = 0;
                }
            }
            changeFirstOne(state, 'isContactFirstOne');
            break;
        case contactAction.changeTab:
            state.tab = payload;
            if (payload === 0) {
                state.verifyUnreadNum = 0;
            }
            changeFirstOne(state, 'isVerifyFirstOne');
            break;
        case chatAction.friendInvitationEvent:
            friendVerify(state, payload);
            break;
        case contactAction.refuseAddFriendSuccess:
            isAgreeAddFriend(state, payload, 3);
            break;
        case contactAction.agreeAddFriendSuccess:
            isAgreeAddFriend(state, payload, 4);
            state.friendList = util.insertSortByLetter(state.friendList, payload);
            break;
        case chatAction.dispatchFriendList:
            state.hasNoSortFriendList = payload;
            state.friendList = util.sortByLetter(state.hasNoSortFriendList);
            break;
        case chatAction.friendReplyEvent:
            friendReply(state, payload);
            state.friendList = util.insertSortByLetter(state.friendList, payload);
            state.hasNoSortFriendList.push(payload);
            break;
        case chatAction.addFriendConfirm:
            waitReply(state, payload);
            break;
        default:
    }
    return state;
};
// 等待好友验证
function waitReply(state, payload) {
    console.log(777, payload);
    let verifyMessage = {
        name: payload.name,
        nickName: payload.nickName,
        avatarUrl: payload.avatarUrl,
        stateType: 6,
        type: 3,
        ctime_ms: new Date().getTime()
    };
    /**
     * 对方同意  对方拒绝  已同意  已拒绝
     * 这些验证消息在消息列表中是永远不会被覆盖的
     */
    for (let i = 0; i < state.verifyMessageList.length; i++) {
        let stateType = state.verifyMessageList[i].stateType;
        const canBeCover = stateType !== 3 && stateType !== 4 && stateType !== 5 && stateType !== 7;
        if (payload.name === state.verifyMessageList[i].name && canBeCover) {
            state.verifyMessageList.splice(i, 1);
            break;
        }
    }
    state.verifyMessageList.unshift(verifyMessage);
}
// 好友应答
function friendReply(state, payload) {
    payload.name = payload.from_username;
    let verifyMessage = {
        name: payload.from_username,
        nickName: '',
        description: payload.description,
        avatarUrl: '',
        extra: payload.extra,
        eventId: payload.event_id,
        stateType: 0,
        type: 3,
        ctime_ms: payload.ctime_ms
    };
    if (payload.description === '') {
        verifyMessage.stateType = 5;
    } else {
        verifyMessage.stateType = 7;
    }
    for (let i = 0; i < state.verifyMessageList.length; i++) {
        let stateType = state.verifyMessageList[i].stateType;
        const canBeCover = stateType !== 3 && stateType !== 4 && stateType !== 5 && stateType !== 7;
        if (state.verifyMessageList[i].name === payload.from_username && canBeCover) {
            state.verifyMessageList.splice(i, 1);
            break;
        }
    }
    state.contactUnreadNum ++;
    state.verifyMessageList.unshift(verifyMessage);
}
function changeFirstOne(state, type) {
    for (let verifyMessage of state.verifyMessageList) {
        verifyMessage[type] = false;
    }
}
// 同意或者拒绝好友请求
function isAgreeAddFriend(state, payload, stateType) {
    for (let verifyMessage of state.verifyMessageList) {
        if (verifyMessage.eventId === payload.eventId) {
            verifyMessage.stateType = stateType;
            break;
        }
    }
}
// 邀请加好友
function friendVerify(state, payload) {
    let verifyMessage = {
        name: payload.from_username,
        nickName: '',
        description: payload.description,
        avatarUrl: '',
        extra: payload.extra,
        eventId: payload.event_id,
        stateType: 0,
        type: 3,
        ctime_ms: payload.ctime_ms,
        isVerifyFirstOne: false,
        isContactFirstOne: false
    };
    /**
     * verifyUnreadNum 用来标识验证信息的的未读数量
     * contactUnreadNum 用来标识联系人的未读数量
     * isVerifyFirstOne 用来标识是否是同一用户的好友邀请的第一条消息（在未读状态），因为未读状态的第一条会显示数量，此后就不再增加未读数量
     * isContactFirstOne 同理，标识联系人
     */
    if (state.tab !== 0 || state.listTab !== 1) {
        state.verifyUnreadNum ++;
        verifyMessage.isVerifyFirstOne = true;
    } else {
        changeFirstOne(state, 'isVerifyFirstOne');
    }
    if (state.listTab !== 1) {
        state.contactUnreadNum ++;
        verifyMessage.isContactFirstOne = true;
    } else {
        changeFirstOne(state, 'isContactFirstOne');
    }
    console.log(state.contactUnreadNum, state.verifyUnreadNum);
    for (let i = 0; i < state.verifyMessageList.length; i++) {
        let message = state.verifyMessageList[i];
        let stateType = message.stateType;
        const canBeCover = stateType !== 3 && stateType !== 4 && stateType !== 5 && stateType !== 7;
        if (message.name === verifyMessage.name && canBeCover) {
            if (message.stateType === 0) {
                if (state.tab !== 0 || state.listTab !== 1) {
                    verifyMessage.isVerifyFirstOne = true;
                }
                if (message.isVerifyFirstOne && (state.tab !== 0 || state.listTab !== 1)) {
                    state.verifyUnreadNum --;
                }
                if (state.listTab !== 1) {
                    verifyMessage.isContactFirstOne = true;
                }
                if (message.isContactFirstOne && state.listTab !== 1) {
                    state.contactUnreadNum --;
                }
            }
            state.verifyMessageList.splice(i, 1);
            break;
        }
    }
    console.log(state.contactUnreadNum, state.verifyUnreadNum);
    state.verifyMessageList.unshift(verifyMessage);
}
// 补全好友的key
function filterConversation(state) {
    for (let friend of state.hasNoSortFriendList) {
        // let flag = true;
        friend.name = friend.username;
        friend.nickName = friend.nickname;
        friend.type = 3;
        // delete friend.username;
        // delete friend.nickname;
        // for (let item of state.conversation) {
        //     if (item.type === 3 && item.name === friend.name) {
        //         flag = false;
        //         friend.key = item.key;
        //         break;
        //     }
        // }
        // if (flag) {
        //     friend.key = --global.conversationKey;
        //     state.messageList.push({
        //         key: global.conversationKey,
        //         msgs: []
        //     });
        // }
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

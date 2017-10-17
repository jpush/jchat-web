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
            // 传递群列表
        case chatAction.dispatchGroupList:
            state.groupList = util.sortByLetter(payload);
            break;
            // 切换联系人或者会话的tab
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
            // 切换联系人中的tab
        case contactAction.changeTab:
            state.tab = payload;
            if (payload === 0) {
                state.verifyUnreadNum = 0;
            }
            changeFirstOne(state, 'isVerifyFirstOne');
            break;
            // 添好友邀请事件
        case chatAction.friendInvitationEventSuccess:
            friendVerify(state, payload);
            break;
            // 自己拒绝添加好友
        case contactAction.refuseAddFriendSuccess:
            isAgreeAddFriend(state, payload, 3);
            break;
            // 自己同意添加好友
        case contactAction.agreeAddFriendSuccess:
            isAgreeAddFriend(state, payload, 4);
            break;
            // 自己同意添加好友失败
        case contactAction.addFriendError:
            addFriendError(state, payload);
            break;
            // 传递好友列表的数据
        case chatAction.dispatchFriendList:
            state.friendList = util.sortByLetter(payload);
            break;
            // 添加好友的应答事件
        case chatAction.friendReplyEventSuccess:
            friendReply(state, payload);
            break;
            // 发送给好友验证信息
        case chatAction.addFriendConfirm:
            waitReply(state, payload);
            break;
            // 添加好友同步事件
        case chatAction.addFriendSyncEvent:
            addFriendSyncEvent(state, payload);
            break;
        default:
    }
    return state;
};
// 多端在线同意好友请求事件
function addFriendSyncEvent(state, payload) {
    for (let user of payload.to_usernames) {
        for (let verifyMessage of state.verifyMessageList) {
            if (verifyMessage.stateType === 0 && verifyMessage.name === user.username) {
                verifyMessage.stateType = 4;
                break;
            }
        }
    }
}
// 同意或拒绝好友请求失败
function addFriendError(state, payload) {
    for (let verifyMessage of state.verifyMessageList) {
        if (verifyMessage.eventId === payload.eventId) {
            verifyMessage.stateType = 0;
            break;
        }
    }
}
// 等待好友验证
function waitReply(state, payload) {
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
        nickName: payload.from_nickname,
        description: payload.description,
        avatarUrl: payload.avatarUrl,
        extra: payload.extra,
        eventId: payload.event_id,
        stateType: 0,
        type: 3,
        ctime_ms: payload.ctime_ms
    };
    if (payload.return_code === 0) {
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
    if (state.tab !== 0 || state.listTab !== 1) {
        state.verifyUnreadNum ++;
    }
    if (state.listTab !== 1) {
        state.contactUnreadNum ++;
    }
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
        nickName: payload.from_nickname,
        description: payload.description,
        avatarUrl: payload.avatarUrl,
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
    state.verifyMessageList.unshift(verifyMessage);
}

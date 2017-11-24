import { contactAction } from '../actions';
import { ContactStore } from '../stores/contact.store';
import { contactInit } from '../model';
import { mainAction } from '../../main/actions';
import { chatAction } from '../../chat/actions';
import { Util } from '../../../services/util';
import { global } from '../../../services/common';

export const contactReducer = (state: ContactStore = contactInit, {type, payload}) => {
    state.actionType = type;
    switch (type) {
            // 初始化state
        case contactAction.init:
            state = Util.deepCopyObj(contactInit);
            break;
            // 传递群列表
        case chatAction.dispatchGroupList:
            state.groupList = Util.sortByLetter(payload);
            break;
            // 切换联系人或者会话的tab
        case mainAction.changeListTab:
            state.listTab = payload;
            changeListTab(state, payload);
            break;
            // 切换联系人中的tab
        case contactAction.changeTab:
            state.tab = payload;
            if (payload === 0) {
                updateUnreadNum(state);
            }
            break;
            // 添加好友邀请事件
        case chatAction.friendInvitationEventSuccess:
            friendVerify(state, payload);
            break;
            // 自己拒绝添加好友
        case contactAction.refuseAddFriendSuccess:
            isAgreeAddFriend(state, payload);
            break;
            // 自己同意添加好友
        case contactAction.agreeAddFriendSuccess:
            isAgreeAddFriend(state, payload);
            break;
            // 自己同意添加好友失败
        case contactAction.addFriendError:
            isAgreeAddFriend(state, payload);
            break;
            // 传递好友列表的数据
        case chatAction.dispatchFriendList:
            state.friendList = Util.sortByLetter(payload);
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
            // 传递收到进入邀请的事件
        case chatAction.dispatchReceiveGroupInvitationEvent:
            filterVerifyGroupList(state, payload);
            break;
            // 同意或者拒绝入群成功
        case contactAction.isAgreeEnterGroupSuccess:
            updateVerifyGroupList(state, payload);
            break;
            // 同意或者拒绝入群失败
        case contactAction.isAgreeEnterGroupError:
            updateVerifyGroupList(state, payload);
            break;
            // 传递被拒绝入群的事件
        case chatAction.dispatchReceiveGroupRefuseEvent:
            filterReceiveGroupRefuse(state, payload);
            break;
            // 切换验证信息的tab
        case contactAction.changeVerifyTab:
            state.verifyTab = payload;
            updateUnreadNum(state);
            break;
        default:
    }
    return state;
};
function changeListTab(state, payload) {
    if (payload === 1) {
        if (state.tab === 0) {
            if (state.verifyTab === 0) {
                state.singleVerifyUnreadNum = 0;
            } else if (state.verifyTab === 1) {
                state.groupVerifyUnreadNum = 0;
            }
            state.verifyUnreadNum = state.groupVerifyUnreadNum + state.singleVerifyUnreadNum;
            state.contactUnreadNum = state.verifyUnreadNum;
        }
    }
}
// 更新验证信息未读数
function updateUnreadNum(state) {
    if (state.verifyTab === 0) {
        state.singleVerifyUnreadNum = 0;
        state.verifyUnreadNum = state.groupVerifyUnreadNum;
        state.contactUnreadNum = state.verifyUnreadNum;
        changeFriendFirstOne(state);
    } else if (state.verifyTab === 1) {
        state.groupVerifyUnreadNum = 0;
        state.verifyUnreadNum = state.singleVerifyUnreadNum;
        state.contactUnreadNum = state.verifyUnreadNum;
        changeGroupFirstOne(state);
    }
}
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
        const stateType = state.verifyMessageList[i].stateType;
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
        const stateType = state.verifyMessageList[i].stateType;
        const canBeCover = stateType !== 3 && stateType !== 4 && stateType !== 5 && stateType !== 7;
        if (state.verifyMessageList[i].name === payload.from_username && canBeCover) {
            state.verifyMessageList.splice(i, 1);
            break;
        }
    }
    if (state.tab !== 0 || state.listTab !== 1 ||
        (state.tab === 0 && state.verifyTab !== 0)) {
        state.singleVerifyUnreadNum ++;
        state.verifyUnreadNum = state.groupVerifyUnreadNum + state.singleVerifyUnreadNum;
        state.contactUnreadNum = state.verifyUnreadNum;
    }
    state.verifyMessageList.unshift(verifyMessage);
}
// 标识好友验证消息已读
function changeFriendFirstOne(state) {
    for (let verifyMessage of state.verifyMessageList) {
        verifyMessage.isFriendFirstOne = false;
    }
}
// 标识群组验证信息已读
function changeGroupFirstOne(state) {
    for (let verifyMessage of state.verifyGroupList) {
        verifyMessage.isGroupFirstOne = false;
    }
}
// 同意或者拒绝好友请求
function isAgreeAddFriend(state, payload) {
    for (let verifyMessage of state.verifyMessageList) {
        if (verifyMessage.eventId === payload.eventId) {
            verifyMessage.stateType = payload.stateType;
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
        isFriendFirstOne: false
    };
    /**
     * verifyUnreadNum 用来标识验证信息的的未读数量
     * contactUnreadNum 用来标识联系人的未读数量
     * isFriendFirstOne 用来标识是否是同一用户的好友邀请的第一条消息（在未读状态），因为未读状态的第一条会显示数量，此后就不再增加未读数量
     */
    let flag = false;
    for (let i = 0; i < state.verifyMessageList.length; i++) {
        let message = state.verifyMessageList[i];
        const stateType = message.stateType;
        const canBeCover = stateType !== 3 && stateType !== 4 && stateType !== 5 && stateType !== 7;
        if (message.name === verifyMessage.name && canBeCover) {
            if (message.stateType === 0) {
                if (message.isFriendFirstOne) {
                    flag = true;
                }
            }
            state.verifyMessageList.splice(i, 1);
            break;
        }
    }
    if ((state.tab !== 0 || state.listTab !== 1 ||
        (state.tab === 0 && state.verifyTab !== 0))) {
        if (!flag) {
            state.singleVerifyUnreadNum ++;
            state.verifyUnreadNum = state.groupVerifyUnreadNum + state.singleVerifyUnreadNum;
            state.contactUnreadNum = state.verifyUnreadNum;
        }
        verifyMessage.isFriendFirstOne = true;
    }
    state.verifyMessageList.unshift(verifyMessage);
}
// 收到群组验证信息
function filterVerifyGroupList(state, payload) {
    payload.stateType = 0;
    payload.isGroupFirstOne = false;
    for (let user of payload.to_usernames) {
        let newPayload = Util.deepCopyObj(payload);
        newPayload.to_usernames = [user];
        let flag = false;
        for (let i = 0; i < state.verifyGroupList.length; i ++) {
            let verifyGroupList = state.verifyGroupList[i];
            if ((verifyGroupList.stateType === 0 || verifyGroupList.stateType === 1 ||
                verifyGroupList.stateType === 2) && verifyGroupList.from_gid === payload.from_gid &&
                verifyGroupList.to_usernames[0].username === user.username) {
                if (verifyGroupList.isGroupFirstOne) {
                    flag = true;
                }
                state.verifyGroupList.splice(i, 1);
                break;
            }
        }
        if (state.tab !== 0 || state.listTab !== 1 ||
            (state.tab === 0 && state.verifyTab !== 1)) {
            if (!flag) {
                state.groupVerifyUnreadNum ++;
                state.verifyUnreadNum = state.groupVerifyUnreadNum + state.singleVerifyUnreadNum;
                state.contactUnreadNum = state.verifyUnreadNum;
            }
            newPayload.isGroupFirstOne = true;
        }
        state.verifyGroupList.unshift(newPayload);
    }
}
// 更新群组验证信息
function updateVerifyGroupList(state, payload) {
    for (let verifyGroup of state.verifyGroupList) {
        if (verifyGroup.event_id === payload.event_id &&
            verifyGroup.to_usernames[0].username === payload.to_usernames[0].username) {
            verifyGroup.stateType = payload.stateType;
            break;
        }
    }
}
// 收到入群被拒绝的事件
function filterReceiveGroupRefuse(state, payload) {
    if (payload.to_usernames[0].username === global.user) {
        payload.stateType = 5;
    } else {
        payload.stateType = 6;
    }
    if (state.tab !== 0 || state.listTab !== 1 ||
        (state.tab === 0 && state.verifyTab !== 1)) {
        state.groupVerifyUnreadNum ++;
        state.verifyUnreadNum = state.groupVerifyUnreadNum + state.singleVerifyUnreadNum;
        state.contactUnreadNum = state.verifyUnreadNum;
    }
    state.verifyGroupList.unshift(payload);
}

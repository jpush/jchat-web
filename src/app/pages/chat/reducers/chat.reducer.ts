import { mainAction } from '../../main/actions';
import { chatAction } from '../actions';
import { ChatStore } from '../stores/chat.store';
import { chatInit } from '../model';
import { contactAction } from '../../contact/actions';
import { global } from '../../../services/common';
import { Util } from '../../../services/util';
let util = new Util();

export const chatReducer = (state: ChatStore = chatInit, {type, payload}) => {
    state.actionType = type;
    switch (type) {
            // 初始化satate
        case chatAction.init:
            state = Object.assign({}, chatInit, {});
            break;
            // 初始化会话
        case chatAction.getConversationSuccess:
            if (payload.storage) {
                state.conversation = payload.conversation;
                state.messageList = payload.messageList;
                state.imageViewer = filterImageViewer(state);
                unreadNum(state, payload);
                filterRecentMsg(state);
                state.msgId = initFilterMsgId(state);
                state.isLoaded = true;
                completionMessageList(state);
            }
            if (payload.shield) {
                initGroupShield(state, payload.shield);
            }
            if (payload.noDisturb) {
                initNoDisturb(state, payload.noDisturb);
            }
            break;
        case contactAction.getFriendListSuccess:
            state.friendList = payload;
            break;
            // 登陆后，离线消息同步消息列表
        case chatAction.getAllMessageSuccess:
            state.messageList = payload;
            state.imageViewer = filterImageViewer(state);
            break;
            // 接收消息
        case chatAction.receiveMessageSuccess:
            addMessage(state, payload);
            let newMsgKey = [];
            for (let item of payload.messages) {
                let key = item.msg_type === 4 ? item.from_gid : item.from_uid;
                newMsgKey.push({key});
            }
            let singleFlag = Number(state.activePerson.key) === Number(state.newMessage.from_uid)
                            && state.newMessage.msg_type === 3;
            let groupFlag = Number(state.activePerson.key) === Number(state.newMessage.from_gid)
                            && state.newMessage.msg_type === 4;
            state.newMessageIsActive = (singleFlag || groupFlag) ? true : false;
            state.msgId = updateFilterMsgId(state, newMsgKey);
            break;
            // 发送单聊文本消息
        case chatAction.sendSingleMessage:

            // 发送群组文本消息
        case chatAction.sendGroupMessage:

            // 发送单聊图片消息
        case chatAction.sendSinglePic:

            // 发送群组图片消息
        case chatAction.sendGroupPic:

            // 发送单聊文件消息
        case chatAction.sendSingleFile:

            // 发送群组文件消息
        case chatAction.sendGroupFile:
            // 判断是否是重发消息
            if (!payload.msgs.repeatSend) {
                addMessage(state, payload);
            }
            break;
            // 发送消息成功（包括所有类型的消息）
        case chatAction.sendMsgComplete:
            sendMsgComplete(state, payload);
            if (payload.success === 2) {
                state.msgId = updateFilterMsgId(state, [{key: payload.key}]);
            }
            break;
            // 转发单聊文本消息
        case chatAction.transmitSingleMessage:
            transmitMessage(state, payload);
            break;
            // 转发群聊文本消息
        case chatAction.transmitGroupMessage:
            transmitMessage(state, payload);
            break;
        case chatAction.transmitMessageComplete:
            sendMsgComplete(state, payload);
            break;
            // 切换当前会话用户
        case chatAction.changeActivePerson:
            clearVoiceTimer(state);
            state.activePerson = Object.assign({}, payload.item, {});
            state.defaultPanelIsShow = payload.defaultPanelIsShow;
            emptyUnreadNum(state, payload.item);
            state.msgId = updateFilterMsgId(state, [{key: state.activePerson.key}]);
            changeActivePerson(state);
            break;
            // 选择联系人
        case contactAction.selectContactItem:
            // 选择搜索出来的本地用户
        case mainAction.selectSearchUser:
            state.defaultPanelIsShow = false;
            clearVoiceTimer(state);
            selectUserResult(state, payload);
            state.activePerson = Object.assign({}, state.conversation[0], {});
            changeActivePerson(state);
            emptyUnreadNum(state, payload);
            state.msgId = updateFilterMsgId(state, [{key: state.activePerson.key}]);
            break;
            // 删除本地会话列表
        case chatAction.deleteConversationItem:
            showGroupSetting(state, false);
            deleteConversationItem(state, payload);
            break;
            // 保存草稿
        case chatAction.saveDraft:
            if (state.messageList[payload[1].activeIndex]) {
                state.messageList[payload[1].activeIndex].draft = payload[0];
            }
            for (let item of state.conversation) {
                if (Number(payload[1].key) === Number(item.key)) {
                    item.draft = payload[0];
                }
            }
            break;
            // 搜索本地用户
        case mainAction.searchUser:
            state.searchUserResult = searchUser(state, payload);
            break;
        case chatAction.searchMessageTransmit:
            state.messageTransmit.searchResult = searchUser(state, payload);
            break;
            // 成功查看别人的信息
        case chatAction.watchOtherInfoSuccess:
            if (payload.black) {
                state.otherInfo.black = payload.black;
            }
            state.otherInfo.info = payload.info;
            state.otherInfo.show = payload.show;
            break;
            // 隐藏别人的信息框
        case chatAction.hideOtherInfo:
            state.otherInfo = payload;
            break;
            // 获取群组信息
        case chatAction.groupInfo:
            let name = '';
            if (payload.groupInfo) {
                state.messageList[state.activePerson.activeIndex].groupSetting.groupInfo =
                    payload.groupInfo;
                if (name !== '' && payload.groupInfo.name === '') {
                    state.messageList[state.activePerson.activeIndex].groupSetting.groupInfo.name
                        = name;
                }
            }
            if (payload.memberList) {
                sortGroupMember(payload.memberList);
                let groupSetting = state.messageList[state.activePerson.activeIndex].groupSetting;
                groupSetting.memberList = payload.memberList;
                // 如果群没有名字，用其群成员名字代替
                name = '';
                for (let item of groupSetting.memberList) {
                    name += (item.nickName !== '' ? item.nickName : item.username) + '、';
                }
                if (name.length > 20) {
                    name = name.slice(0, 20);
                } else {
                    name = name.slice(0, name.length - 1);
                }
                let groupInfo = groupSetting.groupInfo;
                if (name !== '' && groupInfo && groupInfo.name === '') {
                    groupInfo.name = name;
                }
            }
            break;
            // 显示隐藏群组设置
        case chatAction.groupSetting:
            let msg = state.messageList[state.activePerson.activeIndex];
            if (msg && !msg.groupSetting) {
                state.messageList[state.activePerson.activeIndex] = Object.assign({}, msg,
                    {groupSetting: {}});
            }
            showGroupSetting(state, payload.show);
            break;
            // 创建单聊成功
        case mainAction.createSingleChatSuccess:
            clearVoiceTimer(state);
            state.otherInfo.info = payload;
            state.otherInfo.show = true;
            break;
            // 创建群组成功
        case mainAction.createGroupSuccess:
            clearVoiceTimer(state);
            state.activePerson = Object.assign({}, payload, {});
            state.defaultPanelIsShow = false;
            selectUserResult(state, payload);
            changeActivePerson(state);
            state.groupList.push(payload);
            break;
            // 从用户的个人资料创建单聊联系人会话
        case chatAction.createOtherChat:
            showGroupSetting(state, false);
            clearVoiceTimer(state);
            if (payload.username) {
                payload.name = payload.username;
            }
            if (payload.uid) {
                payload.key = payload.uid;
            }
            if (payload.nickname) {
                payload.nickName = payload.nickname;
            }
            state.activePerson = Object.assign({}, payload, {});
            state.defaultPanelIsShow = false;
            selectUserResult(state, payload);
            changeActivePerson(state);
            emptyUnreadNum(state, payload);
            state.msgId = updateFilterMsgId(state, [{key: state.activePerson.key}]);
            break;
            // 获取群组列表成功
        case contactAction.getGroupListSuccess:
            state.groupList = payload;
            break;
            // 退群成功
        case mainAction.exitGroupSuccess:
            showGroupSetting(state, false);
            state.defaultPanelIsShow = true;
            exitGroup(state, payload);
            deleteConversationItem(state, payload);
            break;
            // 加入黑名单成功
        case mainAction.addBlackListSuccess:
            if (state.activePerson.type === 3) {
                state.defaultPanelIsShow = true;
            }
            state.otherInfo.show = false;
            deleteConversationItem(state, payload.deleteItem);
            break;
            // 删除群成员成功
        case mainAction.deleteMemberSuccess:
            deleteGroupItem(state, payload);
            break;
            // 更新群描述
        case chatAction.groupDescription:
            state.groupDeacriptionShow = payload.show;
            if (payload.data) {
                state.messageList[state.activePerson.activeIndex].groupSetting.groupInfo.desc =
                payload.data.group_description;
            }
            break;
            // 更新群名
        case chatAction.groupName:
            updateGroupName(state, payload);
            break;
            // 显示个人信息
        case mainAction.showSelfInfo:
            if (payload.info) {
                state.selfInfo.info = Object.assign({}, state.selfInfo.info , payload.info);
            }
            if (payload.avatar) {
                state.selfInfo.info.avatarUrl = payload.avatar.url;
            }
            break;
            // 或者个人信息头像url
        case chatAction.getSingleAvatarUrl:
            let msgs = state.messageList[state.activePerson.activeIndex].msgs;
            for (let item of msgs) {
                if (item.content.from_id !== global.user) {
                    item.content.avatarUrl = state.activePerson.avatarUrl;
                }
            }
            break;
            // 添加群成员成功
        case mainAction.addGroupMemberSuccess:
            let memberList =
            state.messageList[state.activePerson.activeIndex].groupSetting.memberList;
            state.messageList[state.activePerson.activeIndex].groupSetting.memberList =
            memberList.concat(payload);
            break;
            // 切换群屏蔽
        case chatAction.changeGroupShieldSuccess:
            changeGroupShield(state, payload);
            break;
        case chatAction.changeGroupNoDisturbSuccess:
            changeGroupNoDisturb(state, payload);
            break;
            // 群聊事件
        case chatAction.addGroupMembersEventSuccess:
            groupMembersEvent(state, payload, '被添加进群聊了');
            state.currentIsActive = currentIsActive(state, payload);
            break;
        case chatAction.updateGroupMembersEvent:
            updateGroupMembers(state, payload);
            break;
        case chatAction.deleteGroupMembersEvent:
            groupMembersEvent(state, payload, '被移出群聊了');
            state.currentIsActive = currentIsActive(state, payload);
            if (payload.from_username !== global.user) {
                deleteGroupMembersEvent(state, payload);
            }
            break;
        case chatAction.exitGroupEvent:
            groupMembersEvent(state, payload, '退出群聊了');
            state.currentIsActive = currentIsActive(state, payload);
            deleteGroupMembersEvent(state, payload);
            break;
            // 从localstorage获取已经播放的voice的列表
        case chatAction.getVoiceStateSuccess:
            state.voiceState = payload;
            break;
            // 显示视频模态框
        case chatAction.playVideoShow:
            state.playVideoShow = payload;
            break;
            // 创建群聊事件消息
        case chatAction.createGroupSuccessEvent:
            createGroupSuccessEvent(state, payload);
            break;
            // 消息撤回
        case chatAction.msgRetractEvent:
            msgRetract(state, payload);
            break;
        case mainAction.messageTransmitSearchComplete:
            state.messageTransmit.searchResult = {
                result: {
                    groupArr: [],
                    singleArr: [payload]
                },
                isSearch: true
            };
            break;
        default:
    }
    return state;
};
// 退群
function exitGroup (state, payload) {
    for (let i = 0; i < state.groupList.length; i++) {
        if (Number(state.groupList[i].gid) === Number(payload.gid)) {
            state.groupList.splice(i, 1);
            break;
        }
    }
}
// 隐藏群设置
function showGroupSetting(state, show) {
    if (state.activePerson.activeIndex >= 0) {
        let groupSetting = state.messageList[state.activePerson.activeIndex].groupSetting;
        if (groupSetting) {
            groupSetting.show = show;
        }
    }
}
// 判断当前用户是否是目标用户
function currentIsActive(state, payload) {
    return Number(state.activePerson.key) === Number(payload.gid) ? true : false;
}
// 消息撤回
function msgRetract(state, payload) {
    let name = '';
    let recentMsg = {};
    let index = 0;
    for (let i = 0; i < state.conversation.length; i++) {
        const isGroup = payload.type === 1 &&
            Number(payload.from_gid) === Number(state.conversation[i].key);
        let singleSendName = '';
        if (payload.type === 0 && payload.from_username === global.user) {
            singleSendName = payload.to_usernames[0].username;
        } else if (payload.type === 0) {
            singleSendName = payload.from_username;
        }
        const isSingle =  state.conversation[i].name === singleSendName;
        if (isGroup || isSingle) {
            const msgType = isGroup ? 4 : 3;
            if (payload.from_username === global.user) {
                name = '您';
            } else if (msgType === 4) {
                name = payload.from_username;
            } else if (msgType === 3) {
                name = '对方';
            }
            index = i;
            recentMsg = {
                ctime_ms: payload.ctime_ms,
                content: {
                    msg_body: {
                        text: `${name}撤回了一条消息`
                    },
                    msg_type: 'event'
                },
                conversation_time_show: util.reducerDate(payload.ctime_ms),
                msg_type: msgType
            };
            payload.key = state.conversation[i].key;
            const item = state.conversation.splice(i, 1);
            state.conversation.unshift(item[0]);
            break;
        }
    }
    for (let list of state.messageList) {
        if (Number(payload.key) === Number(list.key)) {
            for (let i = 0; i < list.msgs.length; i++) {
                if (Number(list.msgs[i].msg_id) === Number(payload.msg_ids[0])) {
                    let eventMsg = {
                        ctime_ms: payload.ctime_ms,
                        msg_type: 5,
                        content: {
                            msg_body: {
                                text: `${name}撤回了一条消息`
                            }
                        },
                        time_show: ''
                    };
                    let item = list.msgs.splice(i, 1);
                    eventMsg.time_show = item.time_show;
                    list.msgs.splice(i, 0, eventMsg);
                    if (i === list.msgs.length - 1) {
                        state.conversation[index].recentMsg = recentMsg;
                        state.msgId =
                            updateFilterMsgId(state, [{key: state.conversation[index].key}]);
                    }
                }
            }
        }
    }
}
// 删除群成员事件
function deleteGroupMembersEvent(state, payload) {
    for (let messageList of state.messageList) {
        if (Number(messageList.key) === Number(payload.gid)) {
            if (messageList.groupSetting && messageList.groupSetting.memberList) {
                messageList.groupSetting.memberList =
                messageList.groupSetting.memberList.filter((item1) => {
                    return payload.to_usernames.every((item2) => {
                        return item2.username !== item1.username;
                    });
                });
            }
            break;
        }
    }
}
// 更新群名称
function updateGroupName(state, payload) {
    state.activePerson.name = payload.name =
    state.messageList[state.activePerson.activeIndex].groupSetting.groupInfo.name;
    for (let group of state.groupList) {
        if (Number(payload.gid) === Number(group.gid)) {
            group.name = payload.name;
            break;
        }
    }
    for (let conversation of state.conversation) {
        if (Number(payload.gid) === Number(conversation.key)) {
            conversation.name = payload.name;
            break;
        }
    }
}
// 切换用户前清除语音的定时器
function clearVoiceTimer(state: ChatStore) {
    let activeIndex = state.activePerson.activeIndex;
    let activeMessageList = state.messageList[activeIndex];
    if (activeIndex < 0 || !activeMessageList) {
        return;
    }
    for (let msg of activeMessageList.msgs) {
        if (msg.content.msg_type === 'voice') {
            msg.content.playing = false;
        }
    }
}
// 被添加进群时更新群成员
function updateGroupMembers(state: ChatStore, payload) {
    for (let messageList of state.messageList) {
        if (Number(messageList.key) === Number(payload.eventData.gid)) {
            if (messageList.groupSetting) {
                messageList.groupSetting.memberList =
                messageList.groupSetting.memberList.concat(payload.eventData.to_usernames);
            }
            break;
        }
    }
}
// 接收到管理员建群时自动添加会话和消息
function createGroupSuccessEvent(state, payload) {
    state.conversation.unshift({
        key: payload.gid,
        name: payload.name,
        type: 4,
        unreadNum: 1,
        recentMsg: {
            ctime_ms: payload.ctime_ms,
            content: {
                msg_body: {
                    text: '创建群聊'
                },
                msg_type: 'event'
            },
            conversation_time_show: util.reducerDate(payload.ctime_ms),
            msg_type: 4
        }
    });
    state.messageList.push({
        key: payload.gid,
        msgs: [],
        addGroupOther: [
            {
                text: '创建群聊',
                ctime_ms: payload.ctime_ms,
                time_show: 'today'
            }
        ]
    });
    if (payload.isOffline) {
        sortConversationByRecentMsg(state);
    }
}
// 给群聊事件添加最近一条聊天消息
function isRecentmsg(state, payload, addGroupOther, operation) {
    let flag = false;
    for (let messageList of state.messageList) {
        if (Number(state.conversation[0].key) === Number(messageList.key)) {
            flag = true;
            let msg = messageList['msgs'];
            if (msg.length === 0 || payload.ctime_ms > msg[msg.length - 1].ctime_ms) {
                state.conversation[0].recentMsg = {
                    ctime_ms: payload.ctime_ms,
                    content: {
                        msg_body: {
                            text: addGroupOther + operation
                        },
                        msg_type: 'event'
                    },
                    conversation_time_show: util.reducerDate(payload.ctime_ms),
                    msg_type: 4
                };
            }
            break;
        }
    }
    if (!flag) {
        state.conversation[0].recentMsg = {
            ctime_ms: payload.ctime_ms,
            content: {
                msg_body: {
                    text: addGroupOther + operation
                },
                msg_type: 'event'
            },
            conversation_time_show: util.reducerDate(payload.ctime_ms),
            msg_type: 4
        };
    }
}
// 通过recentMsg去对conversation排序
function sortConversationByRecentMsg(state) {
    for (let conversation of state.conversation) {
        if (conversation.recentMsg) {
            conversation.lastMsgTime = conversation.recentMsg.ctime_ms;
        } else {
            conversation.lastMsgTime = 0;
        }
    }
    let len = state.conversation.length;
    let maxIndex;
    let temp;
    for (let i = 0; i < len - 1; i++) {
        maxIndex = i;
        for (let j = i + 1; j < len; j++) {
            if (state.conversation[j].lastMsgTime >
                state.conversation[maxIndex].lastMsgTime) {
                maxIndex = j;
            }
        }
        temp = Object.assign({}, state.conversation[i], {});
        state.conversation[i] = Object.assign({}, state.conversation[maxIndex], {});
        state.conversation[maxIndex] = temp;
    }
}
// 被添加进群、移出群、退出群的事件
function groupMembersEvent(state: ChatStore, payload, operation) {
    let usernames = payload.to_usernames;
    let addGroupOther = '';
    for (let user of usernames) {
        if (user.username === global.user) {
            addGroupOther = '您' + '、';
        } else {
            let name = '';
            if (user.nickname && user.nickname !== '') {
                name = user.nickname;
            } else {
                name = user.username;
            }
            addGroupOther += name + '、';
        }
    }
    if (addGroupOther.length > 0) {
        addGroupOther = addGroupOther.slice(0, addGroupOther.length - 1);
    }
    let flag1 = true;
    for (let i = 0; i < state.conversation.length; i++) {
        if (Number(payload.gid) === Number(state.conversation[i].key)) {
            if (state.conversation[i].shield) {
                return ;
            }
            flag1 = false;
            let item = state.conversation.splice(i, 1);
            state.conversation.unshift(item[0]);
            if (Number(state.activePerson.key) !== Number(state.conversation[0].key)) {
                state.conversation[0].unreadNum ++;
            }
            isRecentmsg(state, payload, addGroupOther, operation);
            break;
        }
    }
    if (flag1) {
        for (let group of state.groupList) {
            if (Number(group.gid) === Number(payload.gid)) {
                if (group.shield) {
                    return ;
                }
                group.type = 4;
                group.key = group.gid;
                group.unreadNum = 1;
                state.conversation.unshift(group);
                flag1 = false;
                isRecentmsg(state, payload, addGroupOther, operation);
                break;
            }
        }
    }
    if (flag1) {
        let conversation = {
            key: payload.gid,
            name: payload.name,
            type: 4,
            unreadNum: 1,
            recentMsg: {
                ctime_ms: payload.ctime_ms,
                content: {
                    msg_body: {
                        text: addGroupOther + operation
                    },
                    msg_type: 'event'
                },
                conversation_time_show: util.reducerDate(payload.ctime_ms),
                msg_type: 4
            }
        };
        state.conversation.unshift(conversation);
    }
    // 重新对conversation排序
    if (payload.isOffline) {
        sortConversationByRecentMsg(state);
    }
    addEventMsgToMessageList (state, payload, addGroupOther, operation);
}
// 将群聊事件消息添加到消息列表
function addEventMsgToMessageList (state, payload, addGroupOther, operation) {
    let message = {
        ctime_ms: payload.ctime_ms,
        msg_type: 5,
        content: {
            msg_body: {
                text: addGroupOther + operation
            }
        },
        time_show: ''
    };
    let flag2 = true;
    for (let messageList of state.messageList){
        if (Number(payload.gid) === Number(messageList.key)) {
            flag2 = false;
            let msgs = messageList.msgs;
            if (payload.isOffline) {
                if (msgs.length === 0) {
                    message.time_show = util.reducerDate(payload.ctime_ms);
                    msgs.push(message);
                } else if (msgs[msgs.length - 1].ctime_ms < payload.ctime_ms) {
                    if (util.fiveMinutes(msgs[msgs.length - 1].ctime_ms, payload.ctime_ms)) {
                        message.time_show = util.reducerDate(payload.ctime_ms);
                    }
                    msgs.push(message);
                } else {
                    for (let j = 0; j < msgs.length; j++) {
                        if (msgs[j].ctime_ms < payload.ctime_ms &&
                            payload.ctime_ms < msgs[j + 1].ctime_ms) {
                            if (util.fiveMinutes(msgs[j].ctime_ms, payload.ctime_ms)) {
                                message.time_show = util.reducerDate(payload.ctime_ms);
                            }
                            if (!util.fiveMinutes(payload.ctime_ms, msgs[j + 1].ctime_ms)) {
                                messageList.msgs[j + 1].time_show = '';
                            }
                            messageList.msgs.splice(j + 1, 0, message);
                            break;
                        }
                    }
                }
            } else {
                if (msgs.length === 0 ||
                    util.fiveMinutes(msgs[msgs.length - 1].ctime_ms, payload.ctime_ms)) {
                    message.time_show = util.reducerDate(payload.ctime_ms);
                }
                msgs.push(message);
            }
            break;
        }
    }
    if (flag2) {
        state.messageList.push({
            key: payload.gid,
            msgs: []
        });
        message.time_show = util.reducerDate(payload.ctime_ms);
        state.messageList.push(message);
    }
}
// 删除群成员
function deleteGroupItem(state: ChatStore, payload) {
    let memberList = state.messageList[state.activePerson.activeIndex].groupSetting.memberList;
    for (let i = 0; i < memberList.length; i++) {
        if (memberList[i].username === payload.deleteItem.username) {
            memberList.splice(i, 1);
            break;
        }
    }
}
// 离线消息15天后消失，而会话列表依然存在，导致不一一对应，所以补全离线消息
function completionMessageList(state: ChatStore) {
    for (let conversation of state.conversation) {
        let flag = false;
        for (let messageList of state.messageList) {
            if (Number(conversation.key) === Number(messageList.key)) {
                flag = true;
                break;
            }
        }
        if (!flag) {
            state.messageList.push({
                key: conversation.key,
                msgs: []
            });
        }
    }
}
// 初始化群免打扰
function initNoDisturb(state, noDisturb) {
    console.log(55555, noDisturb);
    for (let user of noDisturb.users) {
        for (let conversation of state.conversation) {
            if (user.username === conversation.name) {
                conversation.noDisturb = true;
                break;
            }
        }
    }
    for (let group of noDisturb.groups) {
        group.key = group.gid;
        for (let conversation of state.conversation) {
            if (Number(group.key) === Number(conversation.key)) {
                conversation.noDisturb = true;
                break;
            }
        }
    }
}
// 切换群免打扰
function changeGroupNoDisturb(state, payload) {
    for (let item of state.conversation) {
        if (Number(payload.key) === Number(item.key)) {
            item.noDisturb = !item.noDisturb;
            break;
        }
    }
}
// 初始化群屏蔽
function initGroupShield(state: ChatStore, shield) {
    for (let shieldItem of shield) {
        for (let conversation of state.conversation) {
            if (Number(shieldItem.gid) === Number(conversation.key)) {
                conversation.shield = true;
                break;
            }
        }
    }
}
// 切换群屏蔽
function changeGroupShield(state, payload) {
    for (let item of state.conversation) {
        if (Number(payload.key) === Number(item.key)) {
            item.shield = !item.shield;
            break;
        }
    }
}
// 过滤出当前图片预览的数组
function filterImageViewer(state: ChatStore) {
    let messageList = state.messageList[state.activePerson.activeIndex];
    if (state.activePerson.activeIndex < 0 || !messageList || !messageList.msgs) {
        return [];
    }
    let imgResult = [];
    let msgs = messageList.msgs;
    for (let j = 0; j < msgs.length; j++) {
        let content = msgs[j].content;
        let jpushEmoji = (!content.msg_body.extras || !content.msg_body.extras.kLargeEmoticon
            || content.msg_body.extras.kLargeEmoticon !== 'kLargeEmoticon');
        if (content.msg_type === 'image' && jpushEmoji) {
            imgResult.push({
                src: content.msg_body.media_url,
                width: content.msg_body.width,
                height: content.msg_body.height,
                index: j
            });
        }
    }
    return imgResult;
}
// 切换当前会话用户
function changeActivePerson(state: ChatStore) {
    if (state.activePerson.type === 4 && state.activePerson.gid) {
        state.activePerson.key = state.activePerson.gid;
    }
    for (let i = 0; i < state.messageList.length; i++) {
        if (Number(state.messageList[i].key) === Number(state.activePerson.key)) {
            state.activePerson.activeIndex = i;
            break;
        }
    }
    let list = state.messageList[state.activePerson.activeIndex];
    for (let msg of list.msgs) {
        let video = (msg.content.msg_body.extras && msg.content.msg_body.extras.video);
        if (msg.content.msg_type === 'file' && video) {
            // audio 0 正在加载  1 加载完成  2 正在播放
            msg.content.load = 0;
            // 加载进度 0%
            msg.content.range = 0;
        } else if (msg.content.msg_type === 'voice') {
            // voice 播放时的动画
            msg.content.playing = false;
        }
    }
    // 初始化已读语音消息的状态
    for (let i = 0; i < state.voiceState.length; i++) {
        if (Number(state.voiceState[i].key) === Number(list.key)) {
            let flag = true;
            for (let msg of list.msgs) {
                if (Number(state.voiceState[i].msgId) === Number(msg.msg_id)) {
                    msg.content.havePlay = true;
                    flag = false;
                    break;
                }
            }
            if (flag) {
                state.voiceState.splice(i, 1);
            }
        }
    }
    state.imageViewer = filterImageViewer(state);
}
// 添加最近一条聊天消息
function filterRecentMsg(state: ChatStore) {
    for (let conversation of state.conversation) {
        for (let messageList of state.messageList) {
            if (Number(conversation.key) === Number(messageList.key)) {
                let msgs = messageList.msgs;
                if (msgs.length > 0) {
                    msgs[msgs.length - 1].conversation_time_show =
                    util.reducerDate(msgs[msgs.length - 1].ctime_ms);
                    conversation.recentMsg = msgs[msgs.length - 1];
                }
                break;
            }
        }
    }
    sortConversationByRecentMsg(state);
}
// 初始化msgId(用来判断消息未读数量)
function initFilterMsgId (state) {
    let msgId = [];
    for (let conversation of state.conversation) {
        for (let messageList of state.messageList) {
            if (Number(conversation.key) === Number(messageList.key)) {
                let msgs = messageList.msgs;
                if (!conversation.unreadNum && msgs.length > 0) {
                    msgId.push({
                        key: messageList.key,
                        msgId: msgs[msgs.length - 1].msg_id
                    });
                } else {
                    if (conversation.unreadNum !== msgs.length && msgs.length > 0) {
                        let id = msgs[msgs.length - 1 - conversation.unreadNum].msg_id;
                        msgId.push({
                            key: messageList.key,
                            msgId: id
                        });
                    }
                }
                break;
            }
        }
    }
    return msgId;
}
// 更新msgId
function updateFilterMsgId(state: ChatStore, payload ? ) {
    let msgId;
    for (let messageList of state.messageList) {
        for (let pay of payload) {
            if (Number(messageList.key) === Number(pay.key)) {
                if (messageList.msgs.length > 0) {
                    for (let i = messageList.msgs.length - 1; i > 0; i--) {
                        if (messageList.msgs[i].msg_id) {
                            msgId = messageList.msgs[i].msg_id;
                            break;
                        }
                    }
                }
                let flag = true;
                if (msgId) {
                    for (let a = 0; a < state.msgId.length; a++) {
                        if (Number(state.msgId[a].key) === Number(pay.key)) {
                            flag = false;
                            state.msgId[a] = {
                                key: pay.key,
                                msgId
                            };
                            break;
                        }
                    }
                }
                if (flag) {
                    state.msgId.push({
                        key: pay.key,
                        msgId
                    });
                }
                break;
            }
        }
    }
    return state.msgId;
}
// 将群主放在第一位
function sortGroupMember(memberList) {
    for (let i = 0; i < memberList.length; i++) {
        if (memberList[i].flag === 1) {
            let temp = memberList.splice(i, 1);
            memberList.unshift(temp[0]);
            break;
        }
    }
}
// 初始化消息未读数量
function unreadNum(state: ChatStore, payload) {
    if (!payload.msgId) {
        return ;
    }
    for (let stateMessageList of state.messageList) {
        let flag = false;
        // 当localstorage里面存储了该会话人的msgId
        for (let msgId of payload.msgId) {
            if (Number(stateMessageList.key) === Number(msgId.key)) {
                flag = true;
                let idFlag = false;
                for (let j = 0; j < stateMessageList.msgs.length; j++) {
                    let memberListId = Number(stateMessageList.msgs[j].msg_id);
                    let payloadId = Number(msgId.msgId);
                    if (memberListId === payloadId) {
                        idFlag = true;
                        let unreadNum = 0;
                        for (let c = j + 1; c < stateMessageList.msgs.length; c++) {
                            if (stateMessageList.msgs[c].content.from_id !== global.user) {
                                unreadNum ++;
                            }
                        }
                        for (let conversation of state.conversation) {
                            let memberListKey = Number(stateMessageList.key);
                            let conversationLey = Number(conversation.key);
                            if (memberListKey === conversationLey) {
                                conversation.unreadNum = unreadNum;
                                break;
                            }
                        }
                        break;
                    }
                }
                // 当localstorage里面存储该会话人，但是没有储存对应的msgId
                if (!idFlag) {
                    hasNoMsgId(state, stateMessageList);
                }
                break;
            }
        }
        // 当localstorage里面没有存储该会话人的msgId
        if (!flag) {
            hasNoMsgId(state, stateMessageList);
        }
    }
}
// 会话没有存储该msgId
function hasNoMsgId(state, stateMessageList) {
    let unreadNum = 0;
    for (let msg of stateMessageList.msgs) {
        if (msg.content.from_id !== global.user) {
            unreadNum ++;
        }
    }
    for (let conversation of state.conversation) {
        if (Number(stateMessageList.key) === Number(conversation.key)) {
            conversation.unreadNum = unreadNum;
            break;
        }
    }
}
// 完成消息的发送接口的调用后，返回成功或者失败状态
function sendMsgComplete(state: ChatStore, payload) {
    for (let messageList of state.messageList) {
        if (Number(messageList.key) === Number(payload.key)) {
            let msgs = messageList.msgs;
            for (let j = msgs.length - 1; j >= 0; j--) {
                if (msgs[j].msgKey && Number(payload.msgKey) === Number(msgs[j].msgKey)) {
                    if (payload.msgId) {
                        msgs[j].msg_id = payload.msgId;
                    }
                    msgs[j].success = payload.success;
                    return;
                }
            }
        }
    }
}
// 删除本地的会话列表
function deleteConversationItem(state: ChatStore, payload) {
    let itemKey = Number(payload.item.key ? payload.item.key : payload.item.uid);
    for (let i = 0; i < state.conversation.length; i++) {
        let conversationKey = Number(state.conversation[i].key);
        if (conversationKey === itemKey) {
            state.conversation.splice(i, 1);
            break;
        }
    }
    for (let i = 0; i < state.groupList.length; i++) {
        let groupKey = Number(state.groupList[i].gid);
        if (groupKey === itemKey) {
            state.groupList[i] = Object.assign({}, state.groupList[i], payload.item);
            break;
        }
    }
    if (itemKey === Number(state.activePerson.key)) {
        state.defaultPanelIsShow = true;
        state.activePerson.activeIndex = -1;
        state.activePerson.key = '0';
    }
}
// 转发消息
function transmitMessage (state, payload) {
    // 将当前会话放在第一位
    if (!payload.select.key) {
        payload.select.key = --global.conversationKey;
        state.conversation.unshift(payload.select);
    } else {
        for (let a = 0; a < state.conversation.length; a++) {
            let groupExist = Number(state.conversation[a].key) === Number(payload.select.key) &&
                            payload.select.type === 4;
            let singleExist = payload.select.type === 3 &&
                            state.conversation[a].name === payload.select.name;
            if (groupExist || singleExist) {
                payload.select.conversation_time_show = 'today';
                state.conversation[a].recentMsg = payload.msgs;
                let item = state.conversation.splice(a, 1);
                state.conversation.unshift(item[0]);
                break;
            }
        }
    }
    for (let messageList of state.messageList) {
        if (messageList.key && Number(messageList.key) === Number(payload.select.key)) {
            let msgs = messageList.msgs;
            if (msgs.length === 0 ||
                util.fiveMinutes(msgs[msgs.length - 1].ctime_ms, payload.msgs.ctime_ms)) {
                payload.msgs.time_show = 'today';
            }
            msgs.push(payload.msgs);
            state.newMessage = payload.msgs;
            break ;
        }
    }
}
// 添加自己发的消息到消息面板
function addMyselfMesssge(state: ChatStore, payload) {
    // 更新imageViewer的数组
    if (payload.msgs && payload.msgs.content.from_id === global.user
        && payload.msgs.content.msg_type === 'image') {
        state.imageViewer.push({
            src: payload.msgs.content.msg_body.media_url,
            width: payload.msgs.content.msg_body.width,
            height: payload.msgs.content.msg_body.height,
            index: state.messageList[state.activePerson.activeIndex].msgs.length
        });
    }
    for (let messageList of state.messageList) {
        if (messageList.key && Number(messageList.key) === Number(payload.key)) {
            let msgs = messageList.msgs;
            if (msgs.length === 0 ||
                util.fiveMinutes(msgs[msgs.length - 1].ctime_ms, payload.msgs.ctime_ms)) {
                payload.msgs.time_show = 'today';
            }
            msgs.push(payload.msgs);
            state.newMessage = payload.msgs;
            break ;
        }
    }
    // 将当前会话放在第一位
    for (let a = 0; a < state.conversation.length; a++) {
        if (Number(state.conversation[a].key) === Number(payload.key)) {
            payload.msgs.conversation_time_show = 'today';
            state.conversation[a].recentMsg = payload.msgs;
            let item = state.conversation.splice(a, 1);
            state.conversation.unshift(item[0]);
            break;
        }
    }
}
// 添加消息到消息面板
function addMessage(state: ChatStore, payload) {
    // 自己发消息将消息添加到消息列表
    if (payload.key) {
        addMyselfMesssge(state, payload);
        // 清空会话草稿标志
        for (let conversation of state.conversation) {
            if ((Number(payload.key) === Number(conversation.key) &&
                payload.msgs.content.msg_type === 'text')) {
                conversation.draft = '';
                break;
            }
        }
    // 接收到别人的消息添加到消息列表
    } else {
        let message = payload.messages[0];
        // 更新imageViewer的数组
        let activeKey = Number(state.activePerson.key);
        let isGroupMessage = message.msg_type === 4 &&
            Number(message.from_gid) === Number(activeKey);
        let isSingleMessage = message.msg_type === 3 &&
            Number(message.from_uid) === Number(activeKey);
        let isImage = message.content.msg_type === 'image';

        if ((isGroupMessage || isSingleMessage) && isImage) {
            state.imageViewer.push({
                src: message.content.msg_body.media_url,
                width: message.content.msg_body.width,
                height: message.content.msg_body.height,
                index: state.messageList[state.activePerson.activeIndex].msgs.length
            });
        }
        // 接收到语音初始化播放动画
        let isVoice = message.content.msg_type === 'voice';
        if (isVoice) {
            payload.messages[0].content.playing = false;
            payload.messages[0].content.havePlay = false;
        }
        // 接收到小视频初始化loading
        let isVideo = message.content.msg_type === 'file' &&
            message.content.msg_body.extras &&
            message.content.msg_body.extras.video;
        if (isVideo) {
            payload.messages[0].content.load = 0;
            payload.messages[0].content.range = 0;
        }
        // 给收到的非小视频文件消息添加hover下载按钮所需要的数据
        let isFile = message.content.msg_type === 'file' &&
            (!message.content.msg_body.extras ||
            !message.content.msg_body.extras.video);
        if (isFile) {
            payload.messages[0].downloadHover = {
                tip: '下载文件',
                position: {
                    left: -20,
                    top: 27
                },
                show: false
            };
        }
        let flag = false;
        // 如果发送人在会话列表里
        for (let messageList of state.messageList) {
            let groupMsg = message.msg_type === 4 &&
                Number(messageList.key) === Number(message.from_gid);
            let singleMsg = message.msg_type === 3 &&
                Number(messageList.key) === Number(message.from_uid);
            // 给单聊会话人的消息添加头像
            if (singleMsg) {
                payload.messages[0].content.avatarUrl = state.activePerson.avatarUrl;
            }
            if (groupMsg || singleMsg) {
                let msgs = messageList.msgs;
                if (msgs.length === 0 ||
                    util.fiveMinutes(msgs[msgs.length - 1].ctime_ms, message.ctime_ms)) {
                    payload.messages[0].time_show = 'today';
                }
                msgs.push(payload.messages[0]);
                state.newMessage = payload.messages[0];
                break;
            }
        }
        for (let a = 0; a < state.conversation.length; a ++) {
            let groupMsg = message.msg_type === 4 &&
                    Number(state.conversation[a].key) === Number(message.from_gid);
            let singleMsg = message.msg_type === 3 &&
                    Number(state.conversation[a].key) === Number(message.from_uid);
            if (groupMsg || singleMsg) {
                let groupNoActive = message.msg_type === 4 &&
                    Number(state.activePerson.key) !== Number(message.from_gid);
                let singleNoActive = message.msg_type === 3 &&
                    Number(state.activePerson.key) !== Number(message.from_uid);
                if (groupNoActive || singleNoActive) {
                    if (!state.conversation[a].unreadNum) {
                        state.conversation[a].unreadNum = 1;
                    } else {
                        state.conversation[a].unreadNum ++;
                    }
                }
                flag = true;
                let item = state.conversation.splice(a, 1);
                state.conversation.unshift(item[0]);
                payload.messages[0].conversation_time_show = 'today';
                state.conversation[0].recentMsg = payload.messages[0];
                return ;
            }
        }
        // 如果发送人不在会话列表里
        if (!flag) {
            let msg;
            let conversationItem;
            if (message.msg_type === 3) {
                msg = {
                    key: message.from_uid,
                    msgs: [
                        message
                    ],
                    draft: '',
                    content: message.content
                };
                conversationItem = {
                    avatar: '',
                    avatarUrl: message.content.avatarUrl,
                    key: message.from_uid,
                    mtime: message.ctime_ms,
                    name: message.content.from_id,
                    nickName: message.content.from_name,
                    type: 3,
                    unreadNum: 1
                };
            } else {
                msg = {
                    key: message.from_gid,
                    msgs: [
                        message
                    ],
                    draft: '',
                    content: message.content
                };
                conversationItem = {
                    avatar: '',
                    avatarUrl: '',
                    key: message.from_gid,
                    mtime: message.ctime_ms,
                    name: message.content.target_name,
                    type: 4,
                    unreadNum: 1
                };
            }
            payload.messages[0].conversation_time_show = 'today';
            payload.messages[0].time_show = 'today';
            state.newMessage = msg;
            state.messageList.push(msg);
            state.conversation.unshift(conversationItem);
            state.conversation[0].recentMsg = payload.messages[0];
        }
    }
}
// 搜索用户、群组
function searchUser(state: ChatStore, payload) {
    if (payload === '') {
        return {
            result: {
                groupArr: [],
                singleArr: []
            },
            isSearch: false
        };
    }
    let singleArr = [];
    let groupArr = [];
    // 查找最近联系人
    for (let item of state.conversation) {
        searchSingle(payload, singleArr, item);
    }
    // 查找好友
    for (let item of state.friendList) {
        searchSingle(payload, singleArr, item);
    }
    // 查找群组
    for (let item of state.groupList) {
        let existGroup = (item.name.toLowerCase().indexOf(payload.toLowerCase()) !== -1);
        if (existGroup) {
            groupArr.push(item);
        }
    }
    return {
        result: {
            singleArr,
            groupArr
        },
        isSearch: true
    };
}
function searchSingle(payload, singleArr, item) {
    let existNickName = item.nickName &&
        item.nickName.toLowerCase().indexOf(payload.toLowerCase()) !== -1;
    let existName = item.name &&
        item.name.toLowerCase().indexOf(payload.toLowerCase()) !== -1;
    let existSingle = item.type === 3;
    let isExist = singleArr.filter((single) => {
        return single.name === item.name;
    });
    if (isExist.length > 0) {
        return;
    }
    if (existSingle && existNickName) {
        item.existNickName = true;
        singleArr.push(item);
    } else if (existSingle && existName) {
        item.existName = true;
        singleArr.push(item);
    }
}
// 选择搜索的用户、发起单聊
function selectUserResult(state, payload) {
    if (payload.gid) {
        payload.key = payload.gid;
    }
    let conversation = state.conversation;
    let flag = false;
    for (let i = 0; i < conversation.length; i ++) {
        if (payload.key && Number(conversation[i].key) === Number(payload.key)) {
            let item = conversation.splice(i, 1);
            conversation.unshift(item[0]);
            if (!conversation[0].name) {
                conversation[0].name = payload.name;
                conversation[0].unreadNum = 0;
            }
            flag = true;
            break;
        }
    }
    if (!flag) {
        conversation.unshift(payload);
    }
    let result = state.messageList.filter((item) => {
        return item.key && Number(item.key) === Number(payload.key);
    });
    if (result.length === 0) {
        state.messageList.push({
            key: payload.key,
            msgs: []
        });
    }
}
// 切换当前会话时,清空未读消息数目
function emptyUnreadNum(state: ChatStore, payload) {
    for (let item of state.conversation) {
        if (Number(item.key) === Number(payload.key)) {
            if (item.unreadNum) {
                item.unreadNum = 0;
                break;
            }
        }
    }
}

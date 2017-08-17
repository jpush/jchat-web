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
                state.msgId = filterMsgId(state, 'init');
                state.isLoaded = true;
                completionMessageList(state);
            }
            if (payload.shield) {
                addGroupShield(state, payload.shield);
            }
            break;
            // 登陆后，离线消息同步消息列表
        case chatAction.getAllMessageSuccess:
            state.messageList = payload;
            state.imageViewer = filterImageViewer(state);
            break;
            // 接收消息
        case chatAction.receiveMessageSuccess:
            addMessage(state, payload);
            receiveStorageMsgId(state, payload);
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
                state.msgId = filterMsgId(state, 'update', [{key: payload.key}]);
            }
            break;
            // 切换当前会话用户
        case chatAction.changeActivePerson:
            clearVoiceTimer(state);
            state.activePerson = Object.assign({}, payload.item, {});
            state.defaultPanelIsShow = payload.defaultPanelIsShow;
            emptyUnreadNum(state, payload.item);
            state.msgId = filterMsgId(state, 'update', [{key: state.activePerson.key}]);
            changeActivePerson(state);
            break;
            // 选择联系人
        case contactAction.selectContactItem:
            // 选择搜索出来的本地用户
        case mainAction.selectSearchUser:
            state.defaultPanelIsShow = false;
            clearVoiceTimer(state);
            state.activePerson = Object.assign({}, payload, {});
            selectUserResult(state, payload);
            changeActivePerson(state);
            emptyUnreadNum(state, payload);
            state.msgId = filterMsgId(state, 'update', [{key: state.activePerson.key}]);
            if (state.conversation[0].shield) {
                state.activePerson.shield = state.conversation[0].shield;
            }
            break;
            // 删除本地会话列表
        case chatAction.deleteConversationItem:
            if (state.activePerson.activeIndex >= 0) {
                if (state.messageList[state.activePerson.activeIndex].groupSetting) {
                    state.messageList[state.activePerson.activeIndex].groupSetting.show = false;
                }
            }
            deleteConversationItem(state, payload);
            break;
            // 保存草稿
        case chatAction.saveDraft:
            saveDraft(state, payload);
            break;
            // 搜索本地用户
        case mainAction.searchUser:
            state.searchUserResult = searchUser(state, payload);
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
            groupInfo(state, payload);
            break;
            // 显示隐藏群组设置
        case chatAction.groupSetting:
            let msg = state.messageList[state.activePerson.activeIndex];
            if (!msg.groupSetting) {
                state.messageList[state.activePerson.activeIndex] = Object.assign({}, msg,
                    {groupSetting: {}});
            }
            state.messageList[state.activePerson.activeIndex].groupSetting.show = payload.show;
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
            state.msgId = filterMsgId(state, 'update', [{key: state.activePerson.key}]);
            break;
            // 获取群组列表成功
        case contactAction.getGroupListSuccess:
            state.groupList = payload;
            break;
            // 退群成功
        case mainAction.exitGroupSuccess:
            exitGroup(state, payload, msg);
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
            state.activePerson.name =
            state.messageList[state.activePerson.activeIndex].groupSetting.groupInfo.name =
            payload.name;
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
            // 获取个人信息头像url
        case chatAction.getSingleAvatarUrl:
            getSingleAvatarUrl(state);
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
        default:
    }
    return state;
};
// 存储msgId
function receiveStorageMsgId(state, payload) {
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
    state.msgId = filterMsgId(state, 'update', newMsgKey);
}
// 获取个人头像url
function getSingleAvatarUrl(state) {
    let msgs = state.messageList[state.activePerson.activeIndex].msgs;
    for (let item of msgs) {
        if (item.content.from_id !== global.user) {
            item.content.avatarUrl = state.activePerson.avatarUrl;
        }
    }
}
// 退群
function exitGroup(state, payload, msg) {
    let message = state.messageList[state.activePerson.activeIndex];
    if (!message.groupSetting) {
        state.messageList[state.activePerson.activeIndex] = Object.assign({}, msg,
            {groupSetting: {}});
    }
    state.messageList[state.activePerson.activeIndex].groupSetting.show = payload.show;
    state.defaultPanelIsShow = true;
    state.messageList[state.activePerson.activeIndex].groupSetting.show = false;
    for (let i = 0; i < state.groupList.length; i++) {
        if (Number(state.groupList[i].gid) === Number(payload.gid)) {
            state.groupList.splice(i, 1);
            break;
        }
    }
}
// 保存草稿
function saveDraft(state, payload) {
    if (state.messageList[payload[1].activeIndex]) {
        state.messageList[payload[1].activeIndex].draft = payload[0];
    }
    for (let item of state.conversation) {
        if (Number(payload[1].key) === Number(item.key)) {
            item.draft = payload[0];
        }
    }
}
// 处理群信息
function groupInfo(state, payload) {
    if (payload.groupInfo) {
        let groupSetting = state.messageList[state.activePerson.activeIndex].groupSetting;
        groupSetting.groupInfo = payload.groupInfo;
        // 如果群没有名字，用其群成员名字代替
        if (groupSetting.groupInfo.name === '') {
            groupSetting.groupInfo.name = state.activePerson.name;
        }
    }
    if (payload.memberList) {
        sortGroupMember(payload.memberList);
        let groupSetting = state.messageList[state.activePerson.activeIndex].groupSetting;
        groupSetting.memberList = payload.memberList;
    }
}
// 判断当前用户是否是目标用户
function currentIsActive(state, payload) {
    if (Number(state.activePerson.key) === Number(payload.gid)) {
        return true;
    }
    return false;
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
            ctime_ms: payload.ctime * 1000,
            content: {
                msg_body: {
                    text: '创建群聊'
                },
                msg_type: 'groupEvent'
            },
            conversation_time_show: util.reducerDate(payload.ctime * 1000),
            msg_type: 4
        }
    });
    state.messageList.push({
        key: payload.gid,
        msgs: [],
        addGroupOther: [
            {
                text: '创建群聊',
                ctime_ms: payload.ctime * 1000,
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
            if (msg.length === 0 || payload.ctime * 1000 > msg[msg.length - 1].ctime_ms) {
                state.conversation[0].recentMsg = {
                    ctime_ms: payload.ctime * 1000,
                    content: {
                        msg_body: {
                            text: addGroupOther + operation
                        },
                        msg_type: 'groupEvent'
                    },
                    conversation_time_show: util.reducerDate(payload.ctime * 1000),
                    msg_type: 4
                };
            }
            break;
        }
    }
    if (!flag) {
        state.conversation[0].recentMsg = {
            ctime_ms: payload.ctime * 1000,
            content: {
                msg_body: {
                    text: addGroupOther + operation
                },
                msg_type: 'groupEvent'
            },
            conversation_time_show: util.reducerDate(payload.ctime * 1000),
            msg_type: 4
        };
    }
}
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
            if (state.conversation[i].shield === 'switchRight') {
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
                if (group.shield === 'switchRight') {
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
                ctime_ms: payload.ctime * 1000,
                content: {
                    msg_body: {
                        text: addGroupOther + operation
                    },
                    msg_type: 'groupEvent'
                },
                conversation_time_show: util.reducerDate(payload.ctime * 1000),
                msg_type: 4
            }
        };
        state.conversation.unshift(conversation);
    }
    // 重新对conversation排序
    if (payload.isOffline) {
        sortConversationByRecentMsg(state);
    }
    let flag2 = true;
    for (let messageList of state.messageList){
        if (Number(payload.gid) === Number(messageList.key)) {
            flag2 = false;
            let msgs = messageList.msgs;
            if (msgs.length === 0) {
                let eventObj = {
                    text: addGroupOther + operation,
                    ctime_ms: payload.ctime * 1000,
                    time_show: util.reducerDate(payload.ctime * 1000)
                };
                let add = messageList.addGroupOther;
                if (add) {
                    let fiveMinutes =
                    util.fiveMinutes(add[add.length - 1].ctime_ms, payload.ctime * 1000);
                    if (!fiveMinutes) {
                        eventObj.time_show = '';
                    }
                    messageList.addGroupOther.push(eventObj);
                } else {
                    messageList.addGroupOther = [eventObj];
                }
            } else {
                for (let i = 0; i < msgs.length; i++) {
                    let eventObj = {
                        text: addGroupOther + operation,
                        ctime_ms: payload.ctime * 1000,
                        time_show: ''
                    };
                    if (payload.ctime * 1000 <= msgs[0].ctime_ms) {
                        let add = messageList.addGroupOther;
                        if (add) {
                            let fiveMinutes =
                            util.fiveMinutes(add[add.length - 1].ctime_ms, payload.ctime * 1000);
                            if (fiveMinutes) {
                                eventObj.time_show = util.reducerDate(payload.ctime * 1000);
                            }
                            messageList.addGroupOther.push(eventObj);
                        } else {
                            eventObj.time_show = util.reducerDate(payload.ctime * 1000);
                            messageList.addGroupOther = [eventObj];
                        }
                        // 如果与其之后的普通消息时间间隔小于五分钟，取消显示群聊消息之后的普通消息的时间
                        let fiveMinutes = util.fiveMinutes(payload.ctime * 1000, msgs[0].ctime_ms);
                        if (!fiveMinutes && msgs[0].time_show) {
                            msgs[0].time_show = '';
                        }
                        return ;
                    }
                    if (payload.ctime * 1000 >= msgs[msgs.length - 1].ctime_ms) {
                        let add = msgs[msgs.length - 1].addGroupOther;
                        if (add) {
                            let fiveMinutes =
                            util.fiveMinutes(add[add.length - 1].ctime_ms, payload.ctime * 1000);
                            if (fiveMinutes) {
                                eventObj.time_show = util.reducerDate(payload.ctime * 1000);
                            }
                            msgs[msgs.length - 1].addGroupOther.push(eventObj);
                        } else {
                            let fiveMinutes =
                            util.fiveMinutes(msgs[msgs.length - 1].ctime_ms, payload.ctime * 1000);
                            if (fiveMinutes) {
                                eventObj.time_show = util.reducerDate(payload.ctime * 1000);
                            }
                            msgs[msgs.length - 1].addGroupOther = [eventObj];
                        }
                        return ;
                    }
                    let smallGap = payload.ctime * 1000 > msgs[i].ctime_ms;
                    let largeGap = payload.ctime * 1000 < msgs[i + 1].ctime_ms;
                    if (smallGap && largeGap) {
                        let add = msgs[i].addGroupOther;
                        if (add) {
                            let fiveMinutes =
                            util.fiveMinutes(add[add.length - 1].ctime_ms, payload.ctime * 1000);
                            if (fiveMinutes) {
                                eventObj.time_show = util.reducerDate(payload.ctime * 1000);
                            }
                            msgs[i].addGroupOther.push(eventObj);
                        } else {
                            let fiveMinutes =
                            util.fiveMinutes(msgs[i].ctime_ms, payload.ctime * 1000);
                            if (fiveMinutes) {
                                eventObj.time_show = util.reducerDate(payload.ctime * 1000);
                            }
                            msgs[i].addGroupOther = [eventObj];
                        }
                        // 如果与其之后的普通消息时间间隔小于五分钟，取消显示群聊消息之后的普通消息的时间
                        let fiveMinutes =
                        util.fiveMinutes(payload.ctime * 1000, msgs[i + 1].ctime_ms);
                        if (!fiveMinutes && msgs[i + 1].time_show) {
                            msgs[i + 1].time_show = '';
                        }
                        return ;
                    }
                }
            }
            break;
        }
    }
    if (flag2) {
        state.messageList.push({
            key: payload.gid,
            msgs: [],
            addGroupOther: [
                {
                    text: addGroupOther + operation,
                    ctime_ms: payload.ctime * 1000,
                    time_show: util.reducerDate(payload.ctime * 1000)
                }
            ]
        });
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
// 添加群屏蔽
function addGroupShield(state: ChatStore, shield) {
    for (let shieldItem of shield) {
        for (let conversation of state.conversation) {
            if (Number(shieldItem.gid) === Number(conversation.key)) {
                conversation.shield = 'switchRight';
                break;
            }
        }
    }
}
// 切换群屏蔽
function changeGroupShield(state, payload) {
    for (let item of state.conversation) {
        if (Number(payload.key) === Number(item.key)) {
            if (item.shield === 'switchRight') {
                item.shield = 'switchLeft';
            } else {
                item.shield = 'switchRight';
            }
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
// 更新msgId(用来判断消息未读数量)
function filterMsgId(state: ChatStore, operation: string, payload ? ) {
    if (operation === 'init') {
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
    } else if (operation === 'update') {
        let msgId;
        for (let messageList of state.messageList) {
            for (let pay of payload) {
                if (Number(messageList.key) === Number(pay.key)) {
                    if (messageList.msgs.length > 0) {
                        msgId =
                        messageList.msgs[messageList.msgs.length - 1].msg_id;
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
// 添加消息到消息面板
function addMessage(state: ChatStore, payload) {
    // 自己发消息将消息添加到消息列表
    if (payload.key) {
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
                if (msgs.length === 0) {
                    // 如果有群聊事件消息在前，需要判断一下与群聊事件消息的事件间隔
                    if (messageList.addGroupOther &&
                        messageList.addGroupOther.length > 0) {
                        let ctime_ms = messageList.addGroupOther[0].ctime_ms;
                        let fiveMinutes = util.fiveMinutes(ctime_ms, payload.msgs.ctime_ms);
                        if (fiveMinutes) {
                            payload.msgs.time_show = 'today';
                        }
                    } else {
                        payload.msgs.time_show = 'today';
                    }
                    msgs.push(payload.msgs);
                    state.newMessage = payload.msgs;
                    break ;
                }
                if (util.fiveMinutes(msgs[msgs.length - 1].ctime_ms, payload.msgs.ctime_ms)) {
                    // 如果有群聊事件消息在前，需要判断一下与群聊事件消息的事件间隔
                    if (msgs[msgs.length - 1].addGroupOther &&
                        msgs[msgs.length - 1].addGroupOther.length > 0) {
                        let ctime = msgs[msgs.length - 1].addGroupOther.ctime_ms;
                        let fiveMinutes = util.fiveMinutes(ctime, payload.msgs.ctime_ms);
                        if (fiveMinutes) {
                            payload.msgs.time_show = 'today';
                        }
                    } else {
                        payload.msgs.time_show = 'today';
                    }
                }
                msgs.push(payload.msgs);
                state.newMessage = payload.msgs;
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
        for (let j = 0; j < payload.messages.length; j++) {
            let message = payload.messages[j];
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
                payload.messages[j].content.playing = false;
                payload.messages[j].content.havePlay = false;
            }
            // 接收到小视频初始化loading
            let isVideo = message.content.msg_type === 'file' &&
                message.content.msg_body.extras &&
                message.content.msg_body.extras.video;
            if (isVideo) {
                payload.messages[j].content.load = 0;
                payload.messages[j].content.range = 0;
            }
            // 给收到的非小视频文件消息添加hover下载按钮所需要的数据
            let isFile = message.content.msg_type === 'file' &&
                (!message.content.msg_body.extras ||
                !message.content.msg_body.extras.video);
            if (isFile) {
                payload.messages[j].downloadHover = {
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
                    payload.messages[j].content.avatarUrl = state.activePerson.avatarUrl;
                }
                if (groupMsg || singleMsg) {
                    let msgs = messageList.msgs;
                    if (msgs.length === 0) {
                        // 如果有群聊事件消息在前，需要判断一下与群聊事件消息的事件间隔
                        if (messageList.addGroupOther &&
                            messageList.addGroupOther.length > 0) {
                            let addMtime = messageList.addGroupOther;
                            let ctime = addMtime[addMtime.length - 1].ctime_ms;
                            let fiveMinutes = util.fiveMinutes(ctime, message.ctime_ms);
                            if (fiveMinutes) {
                                payload.messages[j].time_show = 'today';
                            }
                        } else {
                            payload.messages[j].time_show = 'today';
                        }
                    } else {
                        let msgMtime = msgs[msgs.length - 1].ctime_ms;
                        if (msgs.length > 0 &&
                            util.fiveMinutes(msgMtime, message.ctime_ms)) {
                            // 如果有群聊事件消息在前，需要判断一下与群聊事件消息的事件间隔
                            if (msgs[msgs.length - 1].addGroupOther &&
                                msgs[msgs.length - 1].addGroupOther.length > 0) {
                                let addMtime = msgs[msgs.length - 1].addGroupOther.ctime_ms;
                                if (util.fiveMinutes(addMtime, message.ctime_ms)) {
                                    payload.messages[j].time_show = 'today';
                                }
                            } else {
                                payload.messages[j].time_show = 'today';
                            }
                        }
                    }
                    msgs.push(payload.messages[j]);
                    state.newMessage = payload.messages[j];
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
                    payload.messages[j].conversation_time_show = 'today';
                    state.conversation[0].recentMsg = payload.messages[j];
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
                payload.messages[j].conversation_time_show = 'today';
                payload.messages[j].time_show = 'today';
                state.newMessage = msg;
                state.messageList.push(msg);
                state.conversation.unshift(conversationItem);
                state.conversation[0].recentMsg = payload.messages[j];
            }
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
    for (let item of state.conversation) {
        let existNickName = item.nickName &&
            item.nickName.toLowerCase().indexOf(payload.toLowerCase()) !== -1;
        let existName = item.name &&
            item.name.toLowerCase().indexOf(payload.toLowerCase()) !== -1;
        let existSingle = item.type === 3;
        if (existSingle && existNickName) {
            item.existNickName = true;
            singleArr.push(item);
        } else if (existSingle && existName) {
            item.existName = true;
            singleArr.push(item);
        }
    }
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

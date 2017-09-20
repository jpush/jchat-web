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
                state.noDisturb = payload.noDisturb;
                initNoDisturb(state, payload.noDisturb);
            }
            if (state.friendList.length > 0) {
                filteConversationMemoName(state);
            }
            break;
        case chatAction.getFriendListSuccess:
            state.friendList = payload;
            if (state.conversation.length > 0) {
                filteConversationMemoName(state);
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
            let newMsgKey = [];
            // for (let item of payload.messages) {
                // let key = item.msg_type === 4 ? item.from_gid : item.from_uid;
            newMsgKey.push({key: payload.messages[0].key});
            // }
            let singleFlag = Number(state.activePerson.key) === Number(state.newMessage.key)
                            && state.newMessage.msg_type === 3;
            let groupFlag = Number(state.activePerson.key) === Number(state.newMessage.key)
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
            let extras = payload.msgs.content.msg_body.extras;
            if (extras && extras.businessCard) {
                state.sendBusinessCardSuccess = 0;
            }
            break;
            // 发送消息成功（包括所有类型的消息）
        case chatAction.sendMsgComplete:
            sendMsgComplete(state, payload);
            if (payload.success === 2) {
                state.msgId = updateFilterMsgId(state, [{key: payload.key}]);
            }
            if (payload.msgs) {
                let bussinessExtras = payload.msgs.content.msg_body.extras;
                if (bussinessExtras && bussinessExtras.businessCard && payload.success !== 2) {
                    state.sendBusinessCardSuccess = 0;
                } else {
                    state.sendBusinessCardSuccess ++;
                }
            }
            break;
            // 转发单聊文本消息
        case chatAction.transmitSingleMessage:

            // 转发单聊图片消息
        case chatAction.transmitSinglePic:

            // 转发单聊文件消息
        case chatAction.transmitSingleFile:

            // 转发群聊文本消息
        case chatAction.transmitGroupMessage:

            // 转发单聊图片消息
        case chatAction.transmitGroupPic:

            // 转发单聊文件消息
        case chatAction.transmitGroupFile:

            // 转发单聊位置
        case chatAction.transmitSingleLocation:

            // 转发群聊位置
        case chatAction.transmitGroupLocation:
            if (!payload.msgs.repeatSend) {
                state.transmitSuccess = 0;
                transmitMessage(state, payload);
                state.newMessage = payload.msgs;
            }
            break;
            // 转发消息发送成功（包括所有类型的转发消息）
        case chatAction.transmitMessageComplete:
            sendMsgComplete(state, payload);
            if (payload.success !== 2) {
                state.transmitSuccess = 0;
            } else {
                state.transmitSuccess ++;
                state.msgId = updateFilterMsgId(state, [{key: payload.key}]);
            }
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
            selectUserResult(state, payload, 'search');
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
            // if (payload.black) {
            //     state.otherInfo.black = payload.black;
            // }
            payload.info.isFriend = filterFriend(state, payload.info);
            filterSingleBlack(state, payload.info);
            filterSingleNoDisturb(state, payload.info);
            state.otherInfo.info = payload.info;
            state.otherInfo.show = payload.show;
            break;
            // 隐藏别人的信息框
        case chatAction.hideOtherInfo:
            state.otherInfo = payload;
            break;
            // 获取群组信息
        case chatAction.groupInfo:
            if (payload.groupInfo) {
                if (payload.groupInfo.name === '') {
                    payload.groupInfo.name = state.activePerson.name;
                }
                state.messageList[state.activePerson.activeIndex].groupSetting.groupInfo =
                payload.groupInfo;
            }
            if (payload.memberList) {
                sortGroupMember(payload.memberList);
                state.messageList[state.activePerson.activeIndex].groupSetting = {memberList: []};
                let groupSetting = state.messageList[state.activePerson.activeIndex].groupSetting;
                groupSetting.memberList = payload.memberList;
                for (let member of payload.memberList) {
                    for (let friend of state.friendList) {
                        if (friend.name === member.username) {
                            member.memo_name = friend.memo_name;
                            util.getMemo_nameFirstLetter(member);
                            break;
                        }
                    }
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
            // 创建单聊/添加好友
        case mainAction.createSingleChatSuccess:
            /**
             * info.showType
             * 1    发起单聊-非好友-非会话人
             * 2    发起单聊-好友
             * 3    发起单聊-非好友-会话人
             * 4    添加好友-非会话人
             * 5    添加好友-会话人
             * 6    查看资料-好友
             * 7    查看资料-非好友-会话人
             * 8    查看资料-非好友-非会话人
             */
            payload.isFriend = filterFriend(state, payload);
            filterSingleBlack(state, payload);
            filterSingleNoDisturb(state, payload);
            state.otherInfo.info = payload;
            state.otherInfo.show = true;
            break;
        case contactAction.watchVerifyUserSuccess:
            payload.isFriend = filterFriend(state, payload);
            filterSingleBlack(state, payload);
            filterSingleNoDisturb(state, payload);
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
            // if (payload.uid) {
            //     payload.key = payload.uid;
            // }
            if (payload.nickname) {
                payload.nickName = payload.nickname;
            }
            state.defaultPanelIsShow = false;
            selectUserResult(state, payload);
            state.activePerson = Object.assign({}, payload, {});
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
            state.otherInfo.info.black = true;
            updateBlackMenu(state, payload.deleteItem.item);
            break;
            // 删除群成员成功
        case mainAction.deleteMemberSuccess:
            deleteGroupItem(state, payload);
            break;
            // 更新群描述
        case chatAction.groupDescription:
            state.groupDeacriptionShow = payload.show;
            // if (payload.data) {
            //     state.messageList[state.activePerson.activeIndex].groupSetting.groupInfo.desc =
            //     payload.data.group_description;
            // }
            break;
            // 更新群名
        // case chatAction.groupName:
            // updateGroupName(state, payload);
            // break;
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
        case chatAction.updateGroupInfoEventSuccess:
            updateGroupInfoEventSuccess(state, payload);
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
            // 转发消息模态框搜索用户成功
        case mainAction.messageTransmitSearchComplete:
            state.messageTransmit.searchResult = {
                result: {
                    groupArr: [],
                    singleArr: payload ? [payload] : []
                },
                isSearch: true
            };
            break;
            // 显示验证消息模态框
        case chatAction.showVerifyModal:
            state.verifyModal = payload;
            break;
            // 在黑名单列表中删除黑名单
        case mainAction.delSingleBlackSuccess:
            updateBlackMenu(state, payload);
            break;
            // 获取黑名单成功
        case mainAction.blackMenuSuccess:
            state.blackMenu = payload.menu;
            break;
            // 在个人资料中删除黑名单
        case chatAction.deleteSingleBlackSuccess:
            updateBlackMenu(state, payload);
            state.otherInfo.info.black = false;
            break;
            // 添加单聊用户免打扰成功
        case mainAction.addSingleNoDisturbSuccess:
            state.otherInfo.info.noDisturb = true;
            changeSingleNoDisturb(state, payload);
            break;
            // 删除单聊用户免打扰成功
        case chatAction.deleteSingleNoDisturbSuccess:
            state.otherInfo.info.noDisturb = false;
            changeSingleNoDisturb(state, payload);
            break;
            // 个人资料中保存备注名
        case chatAction.saveMemoNameSuccess:
            modifyOtherInfoMemoName(state, payload);
            modifyFriendListMemoName(state, payload);
            modifyConversationMemoName(state, payload);
            modifyActiveMessageList(state, payload);
            break;
            // 删除好友
        case mainAction.deleteFriendSuccess:
            otherInfoDeleteFriend(state, payload);
            break;
            // 同意添加好友
        case contactAction.agreeAddFriendSuccess:
            addNewFriendToConversation(state, payload, 'agree');
            // state.friendList.push(payload);
            break;
        case chatAction.friendReplyEventSuccess:
            // 如果在好友应答时正好打开了该好友的资料
            updateOtherInfo(state, payload);
            addNewFriendToConversation(state, payload, 'reply');
            break;
            // 加载图片预览没有加载的图片url
        case chatAction.loadViewerImageSuccess:
            state.viewerImageUrl = payload;
            break;
        case chatAction.msgFile:
            state.msgFile.show = true;
            break;
        case chatAction.msgFileSuccess:
            if (payload.isFirst) {
                state.messageList = payload.messageList;
                filterMsgFile(state, payload.type);
            }
            filterMsgFileImageViewer(state, payload.type);
            break;
        case chatAction.fileImageLoad:
            fileImageLoad(state, payload);
            break;
        // case chatAction.groupAvatar:
            // updateGroupAvatar(state, payload);
            // break;
        case chatAction.conversationToTopSuccess:
            conversationToTop(state, payload);
            break;
        case chatAction.watchUnreadList:
            state.unreadList = {
                show: true,
                info: {
                    read: [],
                    unread: []
                },
                loading: true
            };
            break;
        case chatAction.watchUnreadListSuccess:
            if (payload.info) {
                state.unreadList.info.read = payload.info.read_list;
                state.unreadList.info.unread = payload.info.unread_list;
            }
            state.unreadList.loading = payload.loading;
            break;
        case chatAction.msgReceiptChangeEvent:
            msgReceiptChangeEvent(state, payload);
            break;
        case chatAction.addReceiptReportAction:
            state.readObj = payload;
            break;
        default:
    }
    return state;
};
function updateGroupInfoEventSuccess(state, payload) {
    payload.eventData.key = payload.eventData.gid;
    payload.eventData.name = payload.eventData.username = payload.eventData.from_username;
    payload.eventData.nickName = payload.eventData.nickname = payload.eventData.from_nickname;
    filterFriend(state, payload.eventData);
    if (Number(payload.eventData.gid) === Number(state.activePerson.key)) {
        state.newMessageIsActive = true;
    } else {
        state.newMessageIsActive = false;
    }
    let item = null;
    let msg = {
        ctime_ms: payload.eventData.ctime_ms,
        msg_type: 5,
        content: {
            msg_body: {
                text: `${payload.eventData.memo_name ||
                    payload.eventData.nickName || payload.eventData.name}修改了群信息`
            },
            msg_type: 'event'
        },
        time_show: '',
        conversation_time_show: 'today'
    };
    for (let list of state.messageList) {
        if (Number(list.key) === Number(payload.eventData.key)) {
            if (list.msgs.length > 0) {
                if (util.fiveMinutes(list.msgs[list.msgs.length - 1].ctime_ms,
                    payload.eventData.ctime_ms)) {
                    msg.time_show = 'today';
                }
            } else {
                msg.time_show = 'today';
            }
            list.msgs.push(msg);
            if (list.groupSetting && list.groupSetting.groupInfo) {
                list.groupSetting.groupInfo = payload.groupInfo;
            }
            break;
        }
    }
    for (let i = 0; i < state.conversation.length; i++) {
        if (Number(state.conversation[i].key) === Number(payload.eventData.key)) {
            item = state.conversation.splice(i, 1)[0];
            if (payload.groupInfo.avatarUrl !== '') {
                item.avatarUrl = payload.groupInfo.avatarUrl;
            }
            if (payload.groupInfo.name !== '') {
                item.name = payload.groupInfo.name;
            }
            break;
        }
    }
    for (let group of state.groupList) {
        if (Number(payload.eventData.key) === Number(group.gid)) {
            if (payload.groupInfo.avatarUrl !== '') {
                group.avatarUrl = payload.groupInfo.avatarUrl;
            }
            if (payload.groupInfo.name !== '') {
                group.name = payload.groupInfo.name;
            }
        }
    }
    if (item === null) {
        item = payload.groupInfo;
        item.type = 4;
        state.messageList.push({
            key: payload.eventData.key,
            msgs: [
                msg
            ]
        });
    }
    item.recentMsg = msg;
    filterTopConversation(state, item);
}
// 已读事件监听
function msgReceiptChangeEvent(state, payload) {
    for (let messageList of state.messageList) {
        if (payload.type === 3) {
            if (messageList.msgs.length > 0) {
                for (let message of messageList.msgs) {
                    if (message.msg_type === 3) {
                        if ((message.content.from_id === payload.username &&
                            message.content.from_appkey === payload.appkey) ||
                            (message.content.target_id === payload.username &&
                            message.content.target_appkey === payload.appkey)) {
                            updateUnreadCount(state, messageList, payload);
                        }
                        break;
                    } else if (message.msg_type === 4) {
                        break;
                    }
                }
            }
        } else {
            if (Number(payload.gid) === Number(messageList.key)) {
                updateUnreadCount(state, messageList, payload);
            }
        }
    }
}
function updateUnreadCount(state, messageList, payload) {
    for (let receipt of payload.receipt_msgs) {
        for (let i = messageList.msgs.length - 1; i >= 0; i --) {
            if (messageList.msgs[i].msg_id === receipt.msg_id) {
                messageList.msgs[i].unread_count = receipt.unread_count;
                break;
            }
        }
    }
    for (let conversation of state.conversation) {
        if (payload.type === 3) {
            if (payload.username === conversation.name &&
                payload.appkey === conversation.appkey) {
                emptyUnreadText(conversation, payload);
            }
        }
    }
}
function emptyUnreadText(conversation, payload) {
    for (let receipt of payload.receipt_msgs) {
        if (conversation.recentMsg &&
            conversation.recentMsg.msg_id === receipt.msg_id) {
            conversation.recentMsg.unread_count = false;
            break;
        }
    }
}
// 消息置顶和取消置顶
function conversationToTop(state, payload) {
    for (let i = 0; i < state.conversation.length; i++) {
        if (Number(state.conversation[i].key) === Number(payload.key)) {
            let item = state.conversation.splice(i, 1)[0];
            // item.isTop = !item.isTop;
            if (item.extras && item.extras.top_time_ms) {
                delete  item.extras.top_time_ms;
            } else {
                item.extras.top_time_ms = new Date().getTime();
            }
            filterTopConversation(state, item);
            break;
        }
    }
}
// 更新群组头像
// function updateGroupAvatar(state, payload) {
//     for (let conversation of state.conversation) {
//         if (Number(payload.gid) === Number(conversation.key)) {
//             conversation.avatarUrl = payload.src;
//             break;
//         }
//     }
//     for (let messageList of state.messageList) {
//         if (Number(messageList.key) === Number(payload.gid)) {
//             messageList.groupSetting.groupInfo.avatarUrl = payload.src;
//             break;
//         }
//     }
// }
function fileImageLoad(state, payload) {
    for (let message of state.msgFileImageViewer) {
        let msgIdFlag = payload.msg_id && message.msg_id === payload.msg_id;
        let msgKeyFlag = payload.msgKey && message.msgKey === payload.msgKey;
        if (msgIdFlag || msgKeyFlag) {
            message.width = payload.content.msg_body.width;
            message.height = payload.content.msg_body.height;
            break;
        }
    }
}
function filterMsgFileImageViewer(state, type: string) {
    state.msgFileImageViewer = [];
    for (let message of state.messageList[state.activePerson.activeIndex].msgs) {
        let fileType = '';
        if (message.content.msg_type === 'file') {
            fileType = util.sortByExt(message.content.msg_body.extras.fileType);
        }
        if ((message.content.msg_type === 'image') || fileType === 'image') {
            console.log(222222, message.content.msg_body);
            state.msgFileImageViewer.push({
                src: message.content.msg_body.media_url,
                width: message.content.msg_body.width,
                height: message.content.msg_body.height,
                msgKey: message.msgKey,
                msg_id: message.msg_id
            });
        }
    }
    state.msgFileImageViewer.reverse();
}
function filterMsgFile(state, type: string) {
    let fileArr = [];
    let msgFile = [];
    for (let message of state.messageList[state.activePerson.activeIndex].msgs) {
        let fileType = '';
        if (message.content.msg_type === 'file') {
            fileType = util.sortByExt(message.content.msg_body.extras.fileType);
        }
        if ((message.content.msg_type === type && type === 'image') || fileType === type) {
            fileArr.push(message);
            state.msgFileImageViewer.push({
                src: message.content.msg_body.media_url,
                width: message.content.msg_body.width,
                height: message.content.msg_body.height,
                msgKey: message.msgKey,
                msg_id: message.msg_id
            });
        }
    }
    for (let i = fileArr.length - 1; i >= 0; i--) {
        const time = new Date (fileArr[i].ctime_ms);
        const year = time.getFullYear();
        const month = util.doubleNumber(time.getMonth() + 1);
        let flag = true;
        const showTime = year + '年' + month + '月';
        for (let item of msgFile) {
            if (item.time === showTime) {
                item.msgs.push(fileArr[i]);
                flag = false;
                break;
            }
        }
        if (flag) {
            msgFile.push({
                time: showTime,
                msgs: [fileArr[i]]
            });
        }
    }
    state.msgFile[type] = msgFile;
}
// 给会话列表添加备注名
function filteConversationMemoName(state) {
    for (let conversation of state.conversation) {
        for (let friend of state.friendList) {
            if (conversation.name === friend.name && conversation.type === 3) {
                conversation.memo_name = friend.memo_name;
            }
            if (conversation.recentMsg && conversation.recentMsg.content.from_id === friend.name
                && conversation.type === 4) {
                conversation.recentMsg.content.memo_name = friend.memo_name;
            }
        }
    }
}
// 更新其他用户资料
function updateOtherInfo(state, payload) {
    if (payload.return_code === 0 && state.otherInfo.info.name === payload.from_username) {
        state.otherInfo.info.isFriend = true;
    }
}
// 用户资料中删除好友
function otherInfoDeleteFriend(state, payload) {
    if (state.otherInfo.info.name === payload.name) {
        state.otherInfo.info.isFriend = false;
        state.otherInfo.show = false;
    }
    for (let i = 0; i < state.friendList.length; i++) {
        if (state.friendList[i].name === payload.name) {
            state.friendList.splice(i, 1);
            break;
        }
    }
    for (let i = 0; i < state.conversation.length; i++) {
        if (state.conversation[i].name === payload.name && state.conversation[i].type === 3) {
            state.conversation.splice(i, 1);
            break;
        }
    }
    if (state.activePerson.name === payload.name && state.activePerson.type === 3) {
        state.defaultPanelIsShow = true;
    }
}
// 修改会话列表的备注名
function modifyConversationMemoName(state, payload) {
    for (let conversation of state.conversation) {
        if (conversation.name === payload.targetName && conversation.type === 3) {
            conversation.memo_name = payload.memoName;
        }
        if (conversation.recentMsg &&
            conversation.recentMsg.content.from_id === payload.targetName) {
            conversation.recentMsg.content.memo_name = payload.memoName;
        }
    }
    if (state.activePerson.name === payload.targetName) {
        state.activePerson.memo_name = payload.memoName;
    }
}
// 修改好友列表的备注名
function modifyFriendListMemoName(state, payload) {
    for (let friend of state.friendList) {
        if (friend.name === payload.targetName) {
            friend.memo_name = payload.memoName;
            break;
        }
    }
}
// 修改用户信息的备注名
function modifyOtherInfoMemoName(state, payload) {
    if (payload.targetName === state.otherInfo.info.name) {
        state.otherInfo.info.memo_name = payload.memoName;
    }
}
// 当前会话有修改了备注的用户时，修改消息列表的备注和群成员的备注
function modifyActiveMessageList(state, payload) {
    if (state.activePerson.activeIndex > 0 && state.activePerson.type === 4) {
        let messageList = state.messageList[state.activePerson.activeIndex];
        let msgs = messageList.msgs;
        for (let message of msgs) {
            if (message.content.from_id === payload.targetName) {
                message.content.memo_name = payload.memoName;
            }
        }
        for (let member of messageList.groupSetting.memberList) {
            if (member.username === payload.targetName) {
                member.memo_name = payload.memoName;
                util.getMemo_nameFirstLetter(member);
            }
        }
    }
}
// 更新（增加或删除）黑名单列表里的用户
function updateBlackMenu(state, payload) {
    let flag = true;
    for (let i = 0; i < state.blackMenu.length; i++) {
        if (state.blackMenu[i].username === payload.username) {
            state.blackMenu.splice(i, 1);
            flag = false;
            break;
        }
    }
    if (flag) {
        state.blackMenu.push({
            username: payload.username,
            appkey: payload.appkey
        });
    }
}
// 判断用户是否是黑名单
function filterSingleBlack(state, payload) {
    for (let black of state.blackMenu) {
        if (black.username === payload.name) {
            payload.black = true;
            break;
        }
    }
}
// 判断用户是否是免打扰
function filterSingleNoDisturb(state, payload) {
    for (let user of state.noDisturb.users) {
        if (user.username === payload.name) {
            payload.noDisturb = true;
            break;
        }
    }
}
// 判断是否是好友
function filterFriend(state, payload) {
    const result = state.friendList.filter((friend) => {
        return friend.name === payload.name || friend.name === payload.username
                || friend.name === payload.from_username;
    });
    if (result.length > 0) {
        payload.memo_name = result[0].memo_name;
    }
    return result.length > 0 ? true : false;
}
// 同意添加好友后添加好友到会话列表
function addNewFriendToConversation(state, payload, type) {
    if (payload.return_code !== 0 && type !== 'agree') {
        return ;
    }
    if (payload.from_username) {
        payload.name  = payload.username = payload.from_username;
        payload.nickName  = payload.nickname = payload.from_nickname;
    }
    if (state.activePerson.type === 3 && payload.from_username === state.activePerson.name) {
        state.newMessageIsActive = true;
    }
    state.friendList.push(payload);
    let item = null;
    let msg = {
        ctime_ms: payload.ctime_ms,
        msg_type: 5,
        content: {
            msg_body: {
                text: '已成功添加为好友'
            },
            msg_type: 'event'
        },
        time_show: '',
        conversation_time_show: 'today'
    };
    for (let i = 0; i < state.conversation.length; i++) {
        if (state.conversation[i].type === 3 && state.conversation[i].name === payload.name) {
            for (let list of state.messageList) {
                if (Number(state.conversation[i].key) === Number(list.key)) {
                    if (list.msgs.length > 0) {
                        if (util.fiveMinutes(list.msgs[list.msgs.length - 1].ctime_ms,
                            payload.ctime_ms)) {
                            msg.time_show = 'today';
                        }
                    } else {
                        msg.time_show = 'today';
                    }
                    list.msgs.push(msg);
                    break;
                }
            }
            if (!state.conversation[i].extras || !state.conversation[i].extras.top_time_ms) {
                item = state.conversation.splice(i, 1)[0];
            } else {
                state.conversation[i].recentMsg = msg;
                return ;
            }
            break;
        }
    }
    if (item === null) {
        payload.key = --global.conversationKey;
        item = payload;
        state.messageList.push({
            key: global.conversationKey,
            msgs: [
                msg
            ]
        });
    }
    item.recentMsg = msg;
    // state.conversation.unshift(item);
    filterTopConversation(state, item);
}
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
    console.log(444444, payload);
    let name = '';
    let recentMsg = {};
    let index;
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
                payload.name = payload.from_username;
                if (filterFriend(state, payload) && payload.memo_name && payload.memo_name !== '') {
                    name = payload.memo_name;
                } else if (payload.from_nickname && payload.from_nickname !== '') {
                    name = payload.from_nickname;
                } else {
                    name = payload.from_username;
                }
            } else if (msgType === 3) {
                name = '对方';
            }
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
            index = i;
            if (!state.conversation[i].extras || !state.conversation[i].extras.top_time_ms) {
                const item = state.conversation.splice(i, 1);
                // state.conversation.unshift(item[0]);
                index = filterTopConversation(state, item[0]);
            }
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
                    eventMsg.ctime_ms = item[0].ctime_ms;
                    // eventMsg.time_show = item[0].time_show;
                    list.msgs.splice(i, 0, eventMsg);
                    if (i === list.msgs.length - 1) {
                        state.conversation[index].recentMsg = recentMsg;
                        state.msgId =
                            updateFilterMsgId(state, [{key: state.conversation[index].key}]);
                    }
                    break;
                }
            }
            break;
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
// function updateGroupName(state, payload) {
//     state.activePerson.name = payload.name;
//     state.messageList[state.activePerson.activeIndex].groupSetting.groupInfo.name = payload.name;
//     for (let group of state.groupList) {
//         if (Number(payload.gid) === Number(group.gid)) {
//             group.name = payload.name;
//             break;
//         }
//     }
//     for (let conversation of state.conversation) {
//         if (Number(payload.gid) === Number(conversation.key)) {
//             conversation.name = payload.name;
//             break;
//         }
//     }
// }
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
    // state.conversation.unshift({
    //     key: payload.gid,
    //     name: payload.name,
    //     type: 4,
    //     unreadNum: 1,
    //     recentMsg: {
    //         ctime_ms: payload.ctime_ms,
    //         content: {
    //             msg_body: {
    //                 text: '创建群聊'
    //             },
    //             msg_type: 'event'
    //         },
    //         conversation_time_show: util.reducerDate(payload.ctime_ms),
    //         msg_type: 4
    //     }
    // });
    let item = {
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
    };
    filterTopConversation(state, item);
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
function isRecentmsg(state, payload, addGroupOther, operation, index) {
    let flag = false;
    for (let messageList of state.messageList) {
        if (Number(state.conversation[index].key) === Number(messageList.key)) {
            flag = true;
            let msg = messageList['msgs'];
            if (msg.length === 0 || payload.ctime_ms > msg[msg.length - 1].ctime_ms) {
                state.conversation[index].recentMsg = {
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
        state.conversation[index].recentMsg = {
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
    let topIndex = 0;
    for (let i = 0; i < len; i++) {
        if (!state.conversation[i].extras || !state.conversation[i].extras.top_time_ms) {
            topIndex = i;
            break;
        }
    }
    for (let i = topIndex; i < len - 1; i++) {
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
            if (filterFriend(state, user) && user.memo_name && user.memo_name !== '') {
                name = user.memo_name;
            } else if (user.nickname && user.nickname !== '') {
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
            let index = i;
            if (!state.conversation[i].extras || !state.conversation[i].extras.top_time_ms) {
                let item = state.conversation.splice(i, 1);
                // state.conversation.unshift(item[0]);
                index = filterTopConversation(state, item[0]);
            }
            if (Number(state.activePerson.key) !== Number(state.conversation[index].key)) {
                state.conversation[index].unreadNum ++;
            }
            isRecentmsg(state, payload, addGroupOther, operation, index);
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
                // state.conversation.unshift(group);
                let index = filterTopConversation(state, group);
                flag1 = false;
                isRecentmsg(state, payload, addGroupOther, operation, index);
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
        // state.conversation.unshift(conversation);
        filterTopConversation(state, conversation);
    }
    // 重新对conversation排序
    if (payload.isOffline) {
        sortConversationByRecentMsg(state);
    }
    addEventMsgToMessageList(state, payload, addGroupOther, operation);
}
// 将群聊事件消息添加到消息列表
function addEventMsgToMessageList(state, payload, addGroupOther, operation) {
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
        message.time_show = util.reducerDate(payload.ctime_ms);
        state.messageList.push({
            key: payload.gid,
            msgs: [message]
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
// 切换单聊用户免打扰
function changeSingleNoDisturb(state, payload) {
    let flag = true;
    for (let i = 0; i < state.noDisturb.users.length; i++) {
        if (payload.name === state.noDisturb.users[i].username) {
            flag = false;
            state.noDisturb.users.splice(i, 1);
        }
    }
    if (flag) {
        state.noDisturb.users.push({
            username: payload.name,
            appkey: payload.appkey
        });
    }
}
// 初始化群免打扰
function initNoDisturb(state, noDisturb) {
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
    let flag = true;
    for (let i = 0; i < state.noDisturb.groups.length; i ++) {
        if (Number(state.noDisturb.groups[i].key) === Number(payload.key)) {
            state.noDisturb.groups.splice(i, 1);
            flag = false;
            break;
        }
    }
    if (flag) {
        state.noDisturb.groups.push({
            key: Number(payload.key),
            name: payload.name,
            appkey: payload.appkey
        });
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
    for (let message of msgs) {
        let content = message.content;
        let jpushEmoji = (!content.msg_body.extras || !content.msg_body.extras.kLargeEmoticon
            || content.msg_body.extras.kLargeEmoticon !== 'kLargeEmoticon');
        if (content.msg_type === 'image' && jpushEmoji) {
            imgResult.push({
                mediaId: content.msg_body.media_id,
                src: content.msg_body.media_url,
                width: content.msg_body.width,
                height: content.msg_body.height,
                // index: j
                msg_id: message.msg_id
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
            msg.content.load = 0;
        }
        // 给群聊消息中的好友添加备注名
        for (let friend of state.friendList) {
            if (friend.name === msg.content.from_id) {
                msg.content.memo_name = friend.memo_name;
                break;
            }
        }
    }
    // 给群成员中的好友添加备注名
    if (state.activePerson.type === 4 &&
        list && list.groupSetting && list.groupSetting.memberList) {
        for (let member of list.groupSetting.memberList) {
            for (let friend of state.friendList) {
                if (friend.name === member.username) {
                    member.memo_name = friend.memo_name;
                    util.getMemo_nameFirstLetter(member);
                    break;
                }
            }
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
                    for (let i = messageList.msgs.length - 1; i >= 0; i--) {
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
                        let atUser = '';
                        for (let c = j + 1; c < stateMessageList.msgs.length; c++) {
                            if (stateMessageList.msgs[c].content.from_id !== global.user) {
                                unreadNum ++;
                                let atList = stateMessageList.msgs[c].content.at_list;
                                if (messageHasAtList(atList) !== '') {
                                    atUser = messageHasAtList(atList);
                                }
                            }
                        }
                        for (let conversation of state.conversation) {
                            let memberListKey = Number(stateMessageList.key);
                            let conversationLey = Number(conversation.key);
                            if (memberListKey === conversationLey) {
                                conversation.unreadNum = unreadNum;
                                conversation.atUser = atUser;
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
    let atUser = '';
    for (let msg of stateMessageList.msgs) {
        if (msg.content.from_id !== global.user) {
            unreadNum ++;
            const text = messageHasAtList(msg.content.at_list);
            if (text !== '') {
                atUser = text;
            }
        }
    }
    for (let conversation of state.conversation) {
        if (Number(stateMessageList.key) === Number(conversation.key)) {
            conversation.unreadNum = unreadNum;
            conversation.atUser = atUser;
            break;
        }
    }
}
// 完成消息的发送接口的调用后，返回成功或者失败状态
function sendMsgComplete(state: ChatStore, payload) {
    if (payload.success === 2) {
        for (let conversation of state.conversation) {
            // 转发消息时没有key
            if (!payload.key) {
                if (payload.name === conversation.name) {
                    payload.key = conversation.key;
                    conversation.key = payload.msgs.key;
                }
            // 转发或者发送消息时key < 0
            } else if (Number(payload.key) < 0) {
                if (Number(payload.key) === Number(conversation.key)) {
                    conversation.key = payload.msgs.key;
                }
            }
            // 给recentMsg添加msg_id
            if (payload.msgs.msg_type === 3) {
                if (Number(payload.key) === Number(conversation.key)) {
                    payload.msgs.unread_count = true;
                    payload.msgs.conversation_time_show =
                        conversation.recentMsg.conversation_time_show;
                    payload.msgs.ctime_ms = conversation.recentMsg.ctime_ms;
                    conversation.recentMsg = payload.msgs;
                }
            }
        }
    }
    for (let messageList of state.messageList) {
        if (Number(messageList.key) === Number(payload.key)) {
            if (Number(payload.key) < 0 && payload.success === 2) {
                messageList.key = payload.msgs.key;
                if (Number(payload.key) === Number(state.activePerson.key)) {
                    state.activePerson.key = payload.msgs.key;
                }
            }
            let msgs = messageList.msgs;
            for (let j = msgs.length - 1; j >= 0; j--) {
                if (msgs[j].msgKey && Number(payload.msgKey) === Number(msgs[j].msgKey)) {
                    if (payload.msgs && payload.success === 2) {
                        let url = msgs[j].content.msg_body.media_url;
                        let localExtras = msgs[j].content.msg_body.extras;
                        if (url) {
                            payload.msgs.content.msg_body.media_url = url;
                        }
                        if (localExtras && localExtras.businessCard) {
                            payload.msgs.content.msg_body.extras.media_url = localExtras.media_url;
                            payload.msgs.content.msg_body.extras.nickName = localExtras.nickName;
                        }
                        delete msgs[j].msg_id;
                        msgs[j] = Object.assign({}, msgs[j], payload.msgs);
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
    let itemKey = Number(payload.item.key);
    for (let i = 0; i < state.conversation.length; i++) {
        let conversationKey = Number(state.conversation[i].key);
        if (conversationKey === itemKey ||
            (state.conversation[i].name === payload.item.name &&
                state.conversation[i].type === 3)) {
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
    for (let i = 0; i < state.friendList.length; i++) {
        if (payload.item.type === 3 && payload.item.name === state.friendList[i].name) {
            state.friendList[i] = Object.assign({}, state.friendList[i], payload.item);
            break;
        }
    }
}
// 转发消息
function transmitMessage (state, payload) {
    payload.msgs.key = payload.select.key;
    let flag = true;
    for (let a = 0; a < state.conversation.length; a++) {
        let groupExist = Number(state.conversation[a].key) === Number(payload.select.key) &&
                        payload.select.type === 4;
        let singleExist = payload.select.type === 3 &&
                        state.conversation[a].name === payload.select.name;
        if (groupExist || singleExist) {
            flag = false;
            payload.select.conversation_time_show = 'today';
            state.conversation[a].recentMsg = payload.msgs;
            if (!state.conversation[a].extras || !state.conversation[a].extras.top_time_ms) {
                let item = state.conversation.splice(a, 1);
                // state.conversation.unshift(item[0]);
                filterTopConversation(state, item[0]);
            }
            break;
        }
    }
    if (flag) {
        payload.select.conversation_time_show = 'today';
        payload.select.key = --global.conversationKey;
        payload.msgs.time_show = 'today';
        payload.select.recentMsg = payload.msgs;
        // state.conversation.unshift(payload.select);
        filterTopConversation(state, payload.select);
        state.messageList.push({
            key: global.conversationKey,
            msgs: [payload.msgs]
        });
        state.newMessage = payload.msgs;
    } else {
        for (let messageList of state.messageList) {
            if (messageList.key && Number(messageList.key) === Number(payload.select.key)) {
                let msgs = messageList.msgs;
                console.log(22222222, msgs[msgs.length - 1].ctime_ms, payload.msgs.ctime_ms);
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
    // 更新imageViewer的数组
    if (payload.msgs.content.msg_type === 'image') {
        let isSingleMessage = state.activePerson.type === 3 &&
                payload.select.name === state.activePerson.name;
        let isGroupMessage = state.activePerson.type === 4 &&
                Number(payload.select.key) === Number(state.activePerson.key);
        if (isSingleMessage || isGroupMessage) {
            state.imageViewer.push({
                src: payload.msgs.content.msg_body.media_url,
                width: payload.msgs.content.msg_body.width,
                height: payload.msgs.content.msg_body.height,
                msgKey: payload.msgs.msgKey
            });
        }
    }
}
// 添加消息到消息面板
function addMessage(state: ChatStore, payload) {
    console.log(66666, payload);
    // 接收到别人的消息添加到消息列表
    if (payload.messages && payload.messages[0]) {
        let message = payload.messages[0];
        filterNewMessage(state, payload, message);
        let flag = false;
        // 如果发送人在会话列表里
        for (let a = 0; a < state.conversation.length; a ++) {
            let groupMsg = message.msg_type === 4 &&
                    Number(state.conversation[a].key) === Number(message.key);
            let singleMsg = message.msg_type === 3 &&
                    state.conversation[a].name === message.content.from_id;
            if (groupMsg || singleMsg) {
                let groupNoActive = message.msg_type === 4 &&
                    Number(state.activePerson.key) !== Number(message.key);
                let singleNoActive = message.msg_type === 3 &&
                    state.activePerson.name !== message.content.from_id;
                if (groupNoActive || singleNoActive) {
                    if (!state.conversation[a].unreadNum) {
                        state.conversation[a].unreadNum = 1;
                    } else {
                        state.conversation[a].unreadNum ++;
                    }
                    const atList = messageHasAtList(payload.messages[0].content.at_list);
                    if (atList !== '') {
                        state.conversation[a].atUser = atList;
                    }
                }
                flag = true;
                if (state.conversation[a].key < 0) {
                    let oldKey = Number(state.conversation[a].key);
                    if (oldKey === Number(state.activePerson.key)) {
                        state.activePerson.key = message.key;
                    }
                    state.conversation[a].key = message.key;
                    for (let messageList of state.messageList) {
                        if (oldKey === Number(messageList.key)) {
                            messageList.key = message.key;
                            break;
                        }
                    }
                }
                let index = a;
                if (!state.conversation[a].extras || !state.conversation[a].extras.top_time_ms) {
                    let item = state.conversation.splice(a, 1);
                    // state.conversation.unshift(item[0]);
                    index = filterTopConversation(state, item[0]);
                }
                state.conversation[index].recentMsg = payload.messages[0];
                payload.messages[0].conversation_time_show = 'today';
                state.newMessageIsDisturb = state.conversation[index].noDisturb ? true : false;
            }
        }
        for (let messageList of state.messageList) {
            let groupMsg = message.msg_type === 4 &&
                Number(messageList.key) === Number(message.key);
            let singleMsg = message.msg_type === 3 &&
                Number(messageList.key) === Number(message.key);
            // 给单聊会话人的消息添加头像
            if (singleMsg) {
                for (let conversation of state.conversation) {
                    if (conversation.name === payload.messages[0].content.from_id) {
                        payload.messages[0].content.avatarUrl = conversation.avatarUrl;
                        break;
                    }
                }
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
        // 如果发送人不在会话列表里
        if (!flag) {
            addMessageUserNoConversation(state, payload, message);
        }
    } else {
        // 自己发消息将消息添加到消息列表
        addMyselfMesssge(state, payload);
        // 清空会话草稿标志
        for (let conversation of state.conversation) {
            if ((Number(payload.key) === Number(conversation.key))) {
                if (payload.msgs.content.msg_type === 'text') {
                    conversation.draft = '';
                }
                break;
            }
        }
    }
}
// 添加自己发的消息到消息面板
function addMyselfMesssge(state: ChatStore, payload) {
    if (!payload.key) {
        payload.active.extras = {};

    } else {
        // 更新imageViewer的数组
        if (payload.msgs && payload.msgs.content.from_id === global.user
            && payload.msgs.content.msg_type === 'image') {
            if (Number(payload.key) === Number(state.activePerson.key)) {
                state.imageViewer.push({
                    src: payload.msgs.content.msg_body.media_url,
                    width: payload.msgs.content.msg_body.width,
                    height: payload.msgs.content.msg_body.height,
                    // index: state.messageList[state.activePerson.activeIndex].msgs.length
                    msgKey: payload.msgs.msgKey
                });
            }
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
                if (payload.msgs.msg_type === 3) {
                    payload.msgs.unread_count = true;
                }
                state.conversation[a].recentMsg = payload.msgs;
                if (!state.conversation[a].extras || !state.conversation[a].extras.top_time_ms) {
                    let item = state.conversation.splice(a, 1);
                    // state.conversation.unshift(item[0]);
                    filterTopConversation(state, item[0]);
                }
                break;
            }
        }
    }
}
// 处理新消息
function filterNewMessage(state, payload, message) {
    // 更新imageViewer的数组
    let isGroupMessage = message.msg_type === 4 &&
        Number(message.key) === Number(state.activePerson.key);
    let isSingleMessage = message.msg_type === 3 &&
        message.content.from_id === state.activePerson.name;
    let isImage = message.content.msg_type === 'image';

    if ((isGroupMessage || isSingleMessage) && isImage) {
        state.imageViewer.push({
            src: message.content.msg_body.media_url,
            width: message.content.msg_body.width,
            height: message.content.msg_body.height,
            // index: state.messageList[state.activePerson.activeIndex].msgs.length
            msg_id: message.msg_id
        });
    }
    // 接收到语音初始化播放动画
    let isVoice = message.content.msg_type === 'voice';
    if (isVoice) {
        payload.messages[0].content.playing = false;
        payload.messages[0].content.havePlay = false;
        payload.messages[0].content.load = 0;
    }
    // 接收到小视频初始化loading
    let isVideo = message.content.msg_type === 'file' &&
        message.content.msg_body.extras &&
        message.content.msg_body.extras.video;
    if (isVideo) {
        payload.messages[0].content.load = 0;
        payload.messages[0].content.range = 0;
    }
}
// 新消息用户不在会话列表中
function addMessageUserNoConversation(state, payload, message) {
    let msg;
    let conversationItem;
    if (message.msg_type === 3) {
        msg = {
            key: message.key,
            msgs: [
                message
            ],
            draft: '',
            content: message.content
        };
        conversationItem = {
            avatar: '',
            avatarUrl: message.content.avatarUrl,
            key: message.key,
            mtime: message.ctime_ms,
            name: message.content.from_id,
            nickName: message.content.from_name,
            type: 3,
            unreadNum: 1,
            noDisturb: false
        };
        for (let user of state.noDisturb.users) {
            if (user.username === message.content.from_id) {
                conversationItem.noDisturb = true;
                state.newMessageIsDisturb = true;
                break;
            }
        }
    } else {
        msg = {
            key: message.key,
            msgs: [
                message
            ],
            draft: '',
            content: message.content
        };
        conversationItem = {
            avatar: '',
            avatarUrl: message.content.avatarUrl,
            key: message.key,
            mtime: message.ctime_ms,
            name: message.content.target_name,
            type: 4,
            unreadNum: 1,
            noDisturb: false
        };
        for (let group of state.noDisturb.groups) {
            if (Number(group.key) === Number(message.key)) {
                conversationItem.noDisturb = true;
                state.newMessageIsDisturb = true;
                break;
            }
        }
    }
    if (!conversationItem.noDisturb) {
        state.newMessageIsDisturb = false;
    }
    payload.messages[0].conversation_time_show = 'today';
    payload.messages[0].time_show = 'today';
    state.newMessage = msg;
    state.messageList.push(msg);
    // state.conversation.unshift(conversationItem);
    let index = filterTopConversation(state, conversationItem);
    state.conversation[index].recentMsg = payload.messages[0];
    const atList = messageHasAtList(payload.messages[0].content.at_list);
    if (atList !== '') {
        state.conversation[index].atUser = atList;
    }
}
// 添加会话列表中的@文本
function messageHasAtList(atList) {
    let atUser = '';
    if (atList && atList.length === 0) {
        atUser = '@所有成员';
    } else if (atList && atList.length > 0) {
        for (let atItem of atList) {
            if (atItem.username === global.user) {
                atUser = '有人@我';
                break;
            }
        }
    }
    return atUser;
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
// 搜索单聊用户或好友
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
function selectUserResult(state, payload, type?: string) {
    if (payload.gid) {
        payload.key = payload.gid;
    }
    let conversation = state.conversation;
    let flag = false;
    let index;
    for (let i = 0; i < conversation.length; i ++) {
        if (payload.key && Number(conversation[i].key) === Number(payload.key) ||
            (conversation[i].name === payload.name && conversation[i].type === 3)) {
            index = i;
            payload.key = conversation[i].key;
            if (!conversation[i].extras || !conversation[i].extras.top_time_ms) {
                let item = conversation.splice(i, 1);
                // conversation.unshift(item[0]);
                index = filterTopConversation(state, item[0]);
            }
            if (!conversation[index].name) {
                conversation[index].name = payload.name;
                conversation[index].unreadNum = 0;
            }
            flag = true;
            break;
        }
    }
    if (!payload.key) {
        payload.key = -- global.conversationKey;
    }
    if (!flag) {
        // conversation.unshift(payload);
        payload.extras = {};
        filterTopConversation(state, payload);
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
    if (type === 'search' && index) {
        state.activePerson = Object.assign({}, state.conversation[index], {});
    } else if (type === 'search') {
        state.activePerson = Object.assign({}, payload, {});
    }
}
// 切换当前会话时,清空未读消息数目
function emptyUnreadNum(state: ChatStore, payload) {
    state.readObj = [];
    for (let item of state.conversation) {
        if (Number(item.key) === Number(payload.key)) {
            item.atUser = '';
            if (item.unreadNum) {
                item.unreadNum = 0;
            }
            break;
        }
    }
}
// 将会话插入到置顶会话之后
function filterTopConversation(state, item) {
    let flag = true;
    let index;
    for (let i = 0; i < state.conversation.length; i++) {
        if (!state.conversation[i].extras || !state.conversation[i].extras.top_time_ms) {
            state.conversation.splice(i, 0, item);
            index = i;
            flag = false;
            break;
        }
    }
    if (flag) {
        state.conversation.push(item);
        index = state.conversation.length - 1;
    }
    return index;
}

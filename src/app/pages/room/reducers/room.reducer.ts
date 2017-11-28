import { roomAction } from '../actions';
import { mainAction } from '../../main/actions';
import { RoomStore } from '../stores';
import { roomInit } from '../model';
import { Util } from '../../../services/util';
import { chatAction } from '../../chat/actions';

export const roomReducer = (state: RoomStore = roomInit, {type, payload}) => {
    state.actionType = type;
    switch (type) {
        case mainAction.init:
            state = Util.deepCopyObj(roomInit);
            break;
        // 成功获取语音已读状态
        case roomAction.getRoomVoiceStateSuccess:
            state.voiceRoomState = payload;
            break;
        // 成功获取聊天室列表
        case roomAction.getRoomListSuccess:
            filterRepeatRoom(state, payload);
            break;
        // 切换聊天室
        case roomAction.changeRoomSuccess:
            state.active = payload.active;
            state.roomDetail = payload.info;
            break;
        // 进入聊天室
        case roomAction.enterRoom:
            state.enterRoomLoading = true;
            break;
        // 成功进入聊天室
        case roomAction.enterRoomSuccess:
            if (state.active.id === payload.id) {
                state.enter = payload;
            }
            state.enterRoomLoading = false;
            state.messageList = [];
            break;
        // 进入聊天室失败
        case roomAction.enterRoomError:
            state.enterRoomLoading = false;
            break;
        // 成功退出聊天室
        case roomAction.exitRoomSuccess:
            state.enter = {
                id: -1
            };
            state.imageViewer = [];
            break;
        // 显示聊天室信息
        case roomAction.showRoomInfomationSuccess:
            state.roomInfomation = payload;
            break;
        // 成功收到聊天室信息
        case roomAction.receiveMessageSuccess:
            addMessage(state, payload);
            state.newMessage = payload;
            break;
        // 收到聊天室信息加载信息的media_url成功
        case roomAction.receiveMessageUrlSuccess:
            filterImageViewer(state, payload);
            break;
        // 发送聊天室消息
        case roomAction.sendTextMsg:

        case roomAction.sendFileMsg:

        case roomAction.sendPicMsg:

        case roomAction.transmitPicMsg:
            if (!payload.repeatSend) {
                addMessage(state, payload.localMsg);
                filterImageViewer(state, payload.localMsg);
            }
            break;
        // 完成聊天室消息的发送
        case roomAction.sendMsgComplete:
            sendMsgComplete(state, payload);
            break;
        // 搜索聊天室ID，点击进入某聊天室
        case mainAction.selectSearchRoomUser:
            addRoomToList(state, payload);
            break;
        // 传递好友列表
        case chatAction.dispatchFriendList:
            state.friendList = payload;
            break;
        // 显示聊天室状态
        case roomAction.showPanel:
            state.showPanel = payload;
            break;
        default:
    }
    return state;
};
// 过滤重复的聊天室，并添加到聊天室列表中
function filterRepeatRoom(state: RoomStore, payload) {
    if (payload.length > 0) {
        let newPayload = [];
        for (let newRoom of payload) {
            let flag = true;
            for (let room of state.roomList) {
                if (newRoom.id === room.id) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                newPayload.push(newRoom);
            }
        }
        state.roomList = state.roomList.concat(newPayload);
    } else {
        state.noMoreRooms = true;
    }
}
// 添加消息到消息列表
function addMessage(state: RoomStore, payload) {
    // 判断消息是否要显示时间
    if (state.messageList.length === 0) {
        payload.time_show = Util.reducerDate(payload.ctime_ms);
    } else {
        const fiveMinutes =
                Util.fiveMinutes(state.messageList[state.messageList.length - 1].ctime_ms,
            payload.ctime_ms);
        if (fiveMinutes) {
            payload.time_show = Util.reducerDate(payload.ctime_ms);
        }
    }
    // 初始化语音动画和未读状态
    if (payload.content.msg_type === 'voice') {
        payload.content.playing = false;
        payload.content.havePlay = false;
        payload.content.load = 0;
    }
    // 初始化小视频动画
    if (payload.content.msg_type === 'file' && payload.content.msg_body.extras &&
        payload.content.msg_body.extras.video) {
        payload.content.load = 0;
        payload.content.range = 0;
    }
    for (let friend of state.friendList) {
        if (friend.username === payload.content.from_id &&
            friend.appkey === payload.content.from_appkey) {
            if (friend.memo_name) {
                payload.content.memo_name = friend.memo_name;
            }
            break;
        }
    }
    state.messageList.push(payload);
}
// 完成消息发送（失败或者成功）
function sendMsgComplete(state: RoomStore, payload) {
    for (let i = state.messageList.length - 1; i >= 0; i--) {
        if (payload.localMsg.msgKey === state.messageList[i].msgKey) {
            state.messageList[i].success = payload.localMsg.success;
            if (payload.msg) {
                let url;
                let loading;
                let extras;
                if (state.messageList[i].content.msg_body.media_url) {
                    url = state.messageList[i].content.msg_body.media_url;
                    loading = state.messageList[i].content.msg_body.loading;
                }
                if (state.messageList[i].content.msg_body.extras) {
                    extras = state.messageList[i].content.msg_body.extras;
                }
                state.messageList[i].content.msg_body = payload.msg.content.msg_body;
                if (url) {
                    state.messageList[i].content.msg_body.media_url = url;
                    state.messageList[i].content.msg_body.loading = loading;
                }
                if (extras) {
                    state.messageList[i].content.msg_body.extras = extras;
                }
            }
            break;
        }
    }
}
// 过滤出当前图片预览的数组
function filterImageViewer(state: RoomStore, payload) {
    let content = payload.content;
    const jpushEmoji = (!content.msg_body.extras || !content.msg_body.extras.kLargeEmoticon
        || content.msg_body.extras.kLargeEmoticon !== 'kLargeEmoticon');
    if (content.msg_type === 'image' && jpushEmoji) {
        let view: any = {
            mediaId: content.msg_body.media_id,
            src: content.msg_body.media_url,
            width: content.msg_body.width,
            height: content.msg_body.height
        };
        if (payload.msg_id) {
            view.msg_id = payload.msg_id;
        } else if (payload.msgKey) {
            view.msgKey = payload.msgKey;
        }
        state.imageViewer.push(view);
    }
}
// 搜索聊天室查看资料
function addRoomToList(state: RoomStore, payload) {
    if (payload.id === state.enter.id) {
        return ;
    }
    state.showPanel = 1;
    let flag = false;
    for (let i = 0; i < state.roomList.length; i ++) {
        if (state.roomList[i].id === payload.id) {
            let item = state.roomList.splice(i, 1)[0];
            state.roomList.unshift(item);
            flag = true;
            break;
        }
    }
    if (!flag) {
        state.roomList.unshift(payload);
    }
    state.active = payload;
    state.roomDetail = payload;
}

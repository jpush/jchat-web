import { roomAction } from '../actions';
import { mainAction } from '../../main/actions';
import { RoomStore } from '../stores';
import { roomInit } from '../model';
import { Util } from '../../../services/util';

export const roomReducer = (state: RoomStore = roomInit, {type, payload}) => {
    state.actionType = type;
    switch (type) {
        case roomAction.getRoomVoiceStateSuccess:
            state.voiceRoomState = payload;
            break;
        case roomAction.getRoomListSuccess:
            filterRepeatRoom(state, payload);
            break;
        case roomAction.changeRoomSuccess:
            state.active = payload.active;
            state.roomDetail = payload.info;
            break;
        case roomAction.enterRoomSuccess:
            if (state.active.id === payload.id) {
                state.enter = payload;
            }
            state.messageList = [];
            break;
        case roomAction.exitRoomSuccess:
            state.enter = {};
            state.imageViewer = [];
            break;
        case roomAction.showRoomInfomationSuccess:
            state.roomInfomation = payload;
            break;
        case roomAction.receiveMessageSuccess:
            addMessage(state, payload);
            state.newMessage = payload;
            break;
        case roomAction.receiveMessageUrlSuccess:
            filterImageViewer(state, payload);
            break;
        case roomAction.sendTextMsg:

        case roomAction.sendFileMsg:

        case roomAction.sendPicMsg:

        case roomAction.transmitPicMsg:
            if (!payload.repeatSend) {
                addMessage(state, payload.localMsg);
                filterImageViewer(state, payload.localMsg);
            }
            break;
        case roomAction.sendMsgComplete:
            sendMsgComplete(state, payload);
            break;
        case mainAction.selectSearchRoomUser:
            addRoomToList(state, payload);
            break;
        default:
    }
    return state;
};
function filterRepeatRoom(state, payload) {
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
    }
}
// 添加消息到消息列表
function addMessage(state, payload) {
    // 判断消息是否要显示时间
    if (state.messageList.length === 0) {
        payload.time_show = Util.reducerDate(payload.ctime_ms);
    } else {
        let fiveMinutes = Util.fiveMinutes(state.messageList[state.messageList.length - 1].ctime_ms,
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
    state.messageList.push(payload);
}
// 完成消息发送（失败或者成功）
function sendMsgComplete(state, payload) {
    for (let i = state.messageList.length - 1; i >= 0; i--) {
        if (payload.localMsg.msgKey === state.messageList[i].msgKey) {
            state.messageList[i].success = payload.localMsg.success;
            break;
        }
    }
}
// 过滤出当前图片预览的数组
function filterImageViewer(state: RoomStore, payload) {
    let content = payload.content;
    let jpushEmoji = (!content.msg_body.extras || !content.msg_body.extras.kLargeEmoticon
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
function addRoomToList(state, payload) {
    let flag = false;
    for (let i = 0; i < state.roomList.length; i ++) {
        if (state.roomList[i].id === payload.id) {
            let item = state.roomList.splice(i , 1)[0];
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

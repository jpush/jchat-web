import { roomAction } from '../actions';
import { RoomStore } from '../stores';
import { roomInit } from '../model';

export const roomReducer = (state: RoomStore = roomInit, {type, payload}) => {
    state.actionType = type;
    switch (type) {
        case roomAction.getRoomListSuccess:
            state.roomList = state.roomList.concat(payload);
            break;
        case roomAction.changeRoomSuccess:
            state.active = payload.active;
            state.roomDetail = payload.info;
            break;
        case roomAction.enterRoomSuccess:
            state.enter = payload;
            state.messageList = [];
            break;
        case roomAction.showRoomInfomationSuccess:
            state.roomInfomation = payload;
            break;
        case roomAction.receiveMessageSuccess:
            state.messageList.push(payload);
            break;
        case roomAction.sendMsgComplete:
            if (payload.repeatSend) {
                for (let i = state.messageList.length - 1; i >= 0; i--) {
                    if (payload.localMsg.msgKey === state.messageList[i].msgKey) {
                        state.messageList[i].success = payload.localMsg.success;
                        break;
                    }
                }
            } else {
                state.messageList.push(payload.localMsg);
            }
            break;
        default:
    }
    return state;
};

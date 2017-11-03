import { roomAction } from '../actions';
import { RoomStore } from '../stores';
import { roomInit } from '../model';

export const roomReducer = (state: RoomStore = roomInit, {type, payload}) => {
    state.actionType = type;
    switch (type) {
        default:
    }
    return state;
};

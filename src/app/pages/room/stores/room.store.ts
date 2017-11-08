export interface RoomStore {
    actionType: string;
    roomList: Array<any>;
    active: Object;
    roomDetail: Object;
    enter: {};
    roomInfomation: {
        show: boolean,
        info: Object
    };
    messageList: Array<any>;
};

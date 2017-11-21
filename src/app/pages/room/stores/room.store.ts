export interface RoomStore {
    actionType: string;
    voiceRoomState: Array<any>;
    roomList: Array<any>;
    active: any;
    roomDetail: Object;
    enter: {};
    roomInfomation: {
        show: boolean,
        info: Object
    };
    messageList: Array<any>;
    imageViewer: Array<any>;
    newMessage: object;
    friendList: Array<any>;
    enterRoomLoading: boolean;
    showPanel: number;
};

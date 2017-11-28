export interface RoomStore {
    actionType: string;
    voiceRoomState: any[];
    roomList: any[];
    active: any;
    roomDetail: Object;
    enter: {
        id: number
    };
    roomInfomation: {
        show: boolean,
        info: object
    };
    messageList: any[];
    imageViewer: any[];
    newMessage: object;
    friendList: any[];
    enterRoomLoading: boolean;
    showPanel: number;
    noMoreRooms: boolean;
};

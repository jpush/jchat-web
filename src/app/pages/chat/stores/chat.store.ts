
export interface ChatStore {
    conversation: Array<any>; // 会话列表
    messageList: Array<any>; // 消息记录列表
    newMessage: any;
    activePerson: {// 当前激活的对话用户
        key: string,
        name: string,
        nickName: string,
        group?: boolean,
        gid?: string,
        activeIndex: number,
        noDisturb: boolean,
        avatarUrl?: string,
        type?: number,
        shield: string
    };
    groupList: Array<any>;
    defaultPanelIsShow: boolean;
    actionType: string;
    otherInfo: {
        show: boolean,
        info: {
            black: boolean,
            noDisturb: boolean
        }
    };
    blackMenu: Array<any>;
    searchUserResult: {
        result: object,
        isSearch: boolean
    };
    recentMsg: Array<any>;
    msgId: Array<any>;
    groupDeacriptionShow: boolean;
    selfInfo: {
        info: {
            avatarUrl: string
        },
    };
    imageViewer: Array<any>;
    voiceState: Array<any>;
    playVideoShow: {
        url: string,
        show: boolean
    };
    isLoaded: boolean;
    currentIsActive: boolean;
    newMessageIsActive: boolean;
    newMessageIsDisturb: boolean;
    friendList: Array<any>;
    messageTransmit: {
        searchResult: object,
        list: Array<any>
    };
    transmitSuccess: number;
    verifyModal: {
        info: object,
        show: boolean
    };
    noDisturb: {
        users: Array<any>,
        groups: Array<any>
    };
    viewerImageUrl: object;
    msgFile: {
        show: boolean,
        audio: Array<any>,
        document: Array<any>,
        video: Array<any>,
        image: Array<any>,
        other: Array<any>
    };
    msgFileImageViewer: Array<any>;
    sendBusinessCardSuccess: number;
    unreadList: {
        show: boolean,
        info: {
            read: Array<any>,
            unread: Array<any>
        },
        loading: boolean
    };
    readObj: object;
    groupShield: Array<any>;
    createGroupSearch: object;
    unreadCount: object;
    roomTransmitMsg: object;
}

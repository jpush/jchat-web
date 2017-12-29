
export interface ChatStore {
    conversation: any[];
    messageList: any[];
    newMessage: any;
    activePerson: {
        key: string,
        name: string,
        nickName: string,
        group?: boolean,
        gid?: string,
        activeIndex: number,
        noDisturb: boolean,
        avatarUrl?: string,
        type?: number,
        shield: boolean,
        memo_name: string,
        appkey: string
    };
    groupList: any[];
    defaultPanelIsShow: boolean;
    actionType: string;
    otherInfo: {
        show: boolean,
        info: {
            black: boolean,
            noDisturb: boolean,
            memo_name: string,
            name: string,
            isFriend: boolean,
            appkey: string
        }
    };
    blackMenu: any[];
    searchUserResult: {
        result: {
            singleArr: any[];
            groupArr: any[];
            roomArr: any[];
        },
        isSearch: boolean;
    };
    recentMsg: any[];
    msgId: any[];
    groupDeacriptionShow: boolean;
    selfInfo: {
        info: {
            avatarUrl: string
        },
    };
    imageViewer: any[];
    voiceState: any[];
    playVideoShow: {
        url: string,
        show: boolean
    };
    isLoaded: boolean;
    currentIsActive: boolean;
    newMessageIsActive: boolean;
    newMessageIsDisturb: boolean;
    friendList: any[];
    messageTransmit: {
        searchResult: object,
        list: any[]
    };
    transmitSuccess: number;
    verifyModal: {
        info: object,
        show: boolean
    };
    noDisturb: {
        users: any[],
        groups: any[]
    };
    viewerImageUrl: object;
    msgFile: {
        show: boolean,
        audio: any[],
        document: any[],
        video: any[],
        image: any[],
        other: any[]
    };
    msgFileImageViewer: any[];
    sendBusinessCardSuccess: number;
    unreadList: {
        show: boolean,
        info: {
            read: any[],
            unread: any[]
        },
        loading: boolean
    };
    readObj: object;
    groupShield: any[];
    createGroupSearch: object;
    unreadCount: object;
    roomTransmitMsg: object;
    isInput: boolean;
    conversationUnreadNum: number;
    receiveGroupInvitationEventObj: object;
    receiveGroupRefuseEventObj: object;
}

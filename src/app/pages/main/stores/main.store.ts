export interface MainStore {
    mainLoading: boolean;
    selfInfo: {
        info: {
            avatar: string;
            avatarUrl: string;
        },
        show: boolean;
        loading: boolean;
    };
    listTab: number;
    createGroup: {
        show: boolean;
        info: object;
        display: boolean;
    };
    logoutShow: boolean;
    modifyPasswordShow: object;
    searchUserResult: {
        result: {
            groupArr: any[];
            singleArr: any[];
            roomArr: any[];
        },
        isSearch: boolean;
    };
    actionType: string;
    tipModal: object;
    createSingleChat: {
        show: boolean;
        info: string;
    };
    blackMenu: {
        menu: any[];
        show: boolean;
    };
    errorApiTip: object;
    logoutKick: {
        show: boolean,
        info: {
            title: string;
            tip: string;
        }
    };
    contactUnreadNum: number;
    conversationUnreadNum: number;
    friendList: any[];
    enterPublicGroup: {
        show: boolean;
        info: object;
    };
    groupInfo: {
        show: boolean;
        info: object;
    };
    groupVerifyModal: {
        show: boolean;
    };
    createGroupNext: {
        show: boolean;
        display: boolean;
        info: object;
    };
}

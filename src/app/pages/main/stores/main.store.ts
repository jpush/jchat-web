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
    };
    logoutShow: boolean;
    modifyPasswordShow: object;
    searchUserResult: {
        result: {
            groupArr: Array<any>;
            singleArr: Array<any>;
            roomArr: Array<any>;
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
        menu: Array<any>;
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
    friendList: Array<any>;
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
}

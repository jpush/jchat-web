export interface MainStore {
    mainLoading: boolean;
    selfInfo: {
        info: {
            avatar: string;
            avatarUrl: string;
        },
        show: boolean;
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
        },
        isSearch: boolean;
    };
    actionType: string;
    tipModal: object;
    createSingleChat: {
        show: boolean,
        info: string
    };
    blackMenu: {
        menu: Array<any>;
        show: boolean;
    };
    createGroupSearch: {
        info: object;
    };
    errorApiTip: object;
    logoutKick: {
        show: boolean,
        info: {
            title: string,
            tip: string
        }
    };
}

export const mainInit = {
    mainLoading: false,
    selfInfo: {
        info: {
            avatar: '',
            avatarUrl: '',
        },
        show: false,
        loading: false
    },
    listTab: 0,
    createGroup: {
        show: false,
        info: {}
    },
    logoutShow: false,
    modifyPasswordShow: {
        repeatLogin: '',
        show: false
    },
    searchUserResult: {
        result: {
            singleArr: [],
            groupArr: []
        },
        isSearch: false
    },
    actionType: '',
    tipModal: {
        show: false,
        info: {}
    },
    createSingleChat: {
        show: false,
        info: ''
    },
    blackMenu: {
        menu: [],
        show: false
    },
    errorApiTip: {},
    logoutKick: {
        show: false,
        info: {
            title: '',
            tip: ''
        }
    },
    contactUnreadNum: 0,
    friendList: []
};

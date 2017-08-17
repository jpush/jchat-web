export const chatInit = {
    conversation: [],
    messageList: [],
    newMessage: {},
    groupList: [],
    activePerson: {
        key: '',
        name: '',
        nickName: '',
        activeIndex: -1,
        noDisturb: false,
        avatarUrl: '',
        shield: ''
    },
    defaultPanelIsShow: true,
    actionType: '',
    otherInfo: {
        info: {},
        show: false,
        black: []
    },
    blackMenu: {
        menu: [],
        show: false
    },
    searchUserResult: {
        result: {},
        isSearch: false
    },
    recentMsg: [],
    msgId: [],
    groupDeacriptionShow: false,
    selfInfo: {
        info: {
            avatarUrl: ''
        }
    },
    imageViewer: [],
    voiceState: [],
    playVideoShow: {
        url: '',
        show: false
    },
    isLoaded: false,
    currentIsActive: false,
    newMessageIsActive: false
};

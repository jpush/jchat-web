export const chatInit = {
    conversation: [],
    messageList: [],
    newMessage: {},
    groupList: [],
    friendList: [],
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
        info: {
            black: false,
            noDisturb: false
        },
        show: false
    },
    blackMenu: [],
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
    newMessageIsActive: false,
    newMessageIsDisturb: false,
    messageTransmit: {
        searchResult: {},
        list: []
    },
    transmitSuccess: 0,
    verifyModal: {
        info: {},
        show: false
    },
    noDisturb: {
        users: [],
        groups: []
    },
    viewerImageUrl: {},
    msgFile: {
        show: false,
        audio: [],
        document: [],
        video: [],
        image: [],
        other: []
    },
    msgFileImageViewer: [],
    sendBusinessCardSuccess: 0,
    unreadList: {
        show: false,
        info: {
            read: [],
            unread: []
        },
        loading: false
    },
    readObj: {},
    groupShield: [],
    createGroupSearch: [],
    unreadCount: {}
};

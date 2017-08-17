
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
        info: object,
        black: Array<any>
    };
    blackMenu: {
        menu: Array<any>,
        show: boolean
    };
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
}

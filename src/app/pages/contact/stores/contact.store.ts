
export interface ContactStore {
    actionType: string;
    groupList: Array<any>;
    friendList: Array<any>;
    verifyMessageList: Array<any>;
    verifyUnreadNum: number;
    contactUnreadNum: number;
    tab: number;
    listTab: number;
}

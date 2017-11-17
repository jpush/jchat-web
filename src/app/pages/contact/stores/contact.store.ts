
export interface ContactStore {
    actionType: string;
    groupList: Array<any>;
    friendList: Array<any>;
    verifyMessageList: Array<any>;
    verifyUnreadNum: number;
    contactUnreadNum: number;
    groupVerifyUnreadNum: number;
    singleVerifyUnreadNum: number;
    tab: number;
    listTab: number;
    verifyTab: number;
    verifyGroupList: Array<any>;
}


export interface ContactStore {
    actionType: string;
    groupList: any[];
    friendList: any[];
    verifyMessageList: any[];
    verifyUnreadNum: number;
    contactUnreadNum: number;
    groupVerifyUnreadNum: number;
    singleVerifyUnreadNum: number;
    tab: number;
    listTab: number;
    verifyTab: number;
    verifyGroupList: any[];
}


export interface ContactStore {
    actionType: string;
    groupList: Array<any>;
    friendList: Array<any>;
    hasNoSortFriendList: Array<any>;
    hasConversation: boolean;
    conversation: Array<any>;
    messageList: Array<any>;
}

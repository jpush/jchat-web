import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';

import { global, authPayload } from '../../services/common';
import { AppStore } from '../../app.store';
import { contactAction } from './actions';
import { mainAction } from '../main/actions';
import { chatAction } from '../chat/actions';

@Component({
    selector: 'contact-component',
    styleUrls: ['./contact.component.scss'],
    templateUrl: './contact.component.html'
})
export class ContactComponent implements OnInit, OnDestroy {
    private contactStream$;
    private groupList = [];
    private tab = 1;
    private friendList = [];
    private verifyMessageList = [];
    private verifyUnreadNum = 0;
    constructor(
        private store$: Store<AppStore>
    ) {
        this.store$.dispatch({
            type: contactAction.init,
            payload: null
        });
    }
    public ngOnInit() {
        this.subscribeStore();
        this.store$.dispatch({
            type: contactAction.getGroupList,
            payload: null
        });
        this.store$.dispatch({
            type: contactAction.getFriendList,
            payload: null
        });
    }
    public ngOnDestroy() {
        this.contactStream$.unsubscribe();
    }
    private subscribeStore() {
        this.contactStream$ = this.store$.select((state) => {
            const contactState = state['contactReducer'];
            this.stateChanged(contactState);
            return state;
        }).subscribe((state) => {
            // pass
        });
    }
    private init() {
        this.groupList = [];
        this.tab = 1;
        this.friendList = [];
        this.verifyMessageList = [];
        this.verifyUnreadNum = 0;
    }
    private stateChanged(contactState) {
        console.log('contact', contactState);
        switch (contactState.actionType) {
            case contactAction.init:
                this.init();
                break;
            case contactAction.getGroupListSuccess:
                this.groupList = contactState.groupList;
                break;
            case chatAction.createGroupSuccessEvent:

            case mainAction.createGroupSuccess:
                this.groupList = contactState.groupList;
                break;
            case chatAction.dispatchConversationList:

            case contactAction.getFriendListSuccess:
                this.friendList = contactState.friendList;
                break;
            case chatAction.updateContactInfo:
                this.groupList = contactState.groupList;
                break;
            case mainAction.exitGroupSuccess:
                this.groupList = contactState.groupList;
                break;
            case mainAction.changeListTab:
                this.verifyUnreadNum = contactState.verifyUnreadNum;
                break;
            case contactAction.changeTab:
                this.tab = contactState.tab;
                this.verifyUnreadNum = contactState.verifyUnreadNum;
                break;
            case chatAction.friendInvitationEvent:
                this.verifyMessageList = contactState.verifyMessageList;
                this.verifyUnreadNum = contactState.verifyUnreadNum;
                this.store$.dispatch({
                    type: contactAction.dispatchContactUnreadNum,
                    payload: contactState.contactUnreadNum
                });
                break;
            case chatAction.friendReplyEvent:
                this.verifyMessageList = contactState.verifyMessageList;
                this.friendList = contactState.friendList;
                this.verifyUnreadNum = contactState.verifyUnreadNum;
                this.store$.dispatch({
                    type: contactAction.dispatchContactUnreadNum,
                    payload: contactState.contactUnreadNum
                });
                break;
            case contactAction.refuseAddFriendSuccess:
                this.verifyMessageList = contactState.verifyMessageList;
                break;
            case chatAction.dispatchFriendList:
                this.friendList = contactState.friendList;
                break;
            case chatAction.addFriendConfirm:
                this.verifyMessageList = contactState.verifyMessageList;
                break;
            case contactAction.addFriendError:
                this.verifyMessageList = contactState.verifyMessageList;
                break;
            default:
        }
    }
    // 点击联系人
    private selectContactItemEmit(item) {
        item.type = item.gid ? 4 : 3;
        this.store$.dispatch({
            type: contactAction.selectContactItem,
            payload: item
        });
    }
    private changeTabEmit(tab) {
        this.store$.dispatch({
            type: contactAction.changeTab,
            payload: tab
        });
    }
    private isAgreeAddFriendEmit(message) {
        this.store$.dispatch({
            type: contactAction.isAgreeAddFriend,
            payload: message
        });
    }
    private watchVerifyUserEmit(message) {
        console.log(message);
        this.store$.dispatch({
            type: contactAction.watchVerifyUser,
            payload: message
        });
    }
}

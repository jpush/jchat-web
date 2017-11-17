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
    private verifyGroupList = [];
    private verifyUnreadNum = 0;
    private verifyTab = 0;
    private groupVerifyUnreadNum = 0;
    private singleVerifyUnreadNum = 0;
    constructor(
        private store$: Store<AppStore>
    ) {
        // paa
    }
    public ngOnInit() {
        this.store$.dispatch({
            type: contactAction.init,
            payload: null
        });
        this.subscribeStore();
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
        console.log('contactState', contactState);
        switch (contactState.actionType) {
            case contactAction.init:
                this.init();
                break;
            case chatAction.dispatchGroupList:
                this.groupList = contactState.groupList;
                break;
            case mainAction.changeListTab:
                this.verifyUnreadNum = contactState.verifyUnreadNum;
                this.groupVerifyUnreadNum = contactState.groupVerifyUnreadNum;
                this.singleVerifyUnreadNum = contactState.singleVerifyUnreadNum;
                break;
            case contactAction.changeTab:
                this.tab = contactState.tab;
                this.verifyUnreadNum = contactState.verifyUnreadNum;
                this.groupVerifyUnreadNum = contactState.groupVerifyUnreadNum;
                this.singleVerifyUnreadNum = contactState.singleVerifyUnreadNum;
                this.store$.dispatch({
                    type: contactAction.dispatchContactUnreadNum,
                    payload: contactState.contactUnreadNum
                });
                break;
            case chatAction.friendInvitationEventSuccess:
                this.verifyMessageList = contactState.verifyMessageList;
                this.verifyUnreadNum = contactState.verifyUnreadNum;
                this.groupVerifyUnreadNum = contactState.groupVerifyUnreadNum;
                this.singleVerifyUnreadNum = contactState.singleVerifyUnreadNum;
                this.store$.dispatch({
                    type: contactAction.dispatchContactUnreadNum,
                    payload: contactState.contactUnreadNum
                });
                break;
            case chatAction.friendReplyEventSuccess:
                this.verifyMessageList = contactState.verifyMessageList;
                this.verifyUnreadNum = contactState.verifyUnreadNum;
                this.store$.dispatch({
                    type: contactAction.dispatchContactUnreadNum,
                    payload: contactState.contactUnreadNum
                });
                break;
            case chatAction.dispatchFriendList:
                this.friendList = contactState.friendList;
                break;
            case contactAction.refuseAddFriendSuccess:

            case chatAction.addFriendConfirm:

            case contactAction.addFriendError:

            case chatAction.addFriendSyncEvent:
                this.verifyMessageList = contactState.verifyMessageList;
                break;
            case chatAction.receiveGroupInvitationEventSuccess:
                this.store$.dispatch({
                    type: contactAction.dispatchContactUnreadNum,
                    payload: contactState.contactUnreadNum
                });
                this.verifyGroupList = contactState.verifyGroupList;
                this.verifyUnreadNum = contactState.verifyUnreadNum;
                this.groupVerifyUnreadNum = contactState.groupVerifyUnreadNum;
                this.singleVerifyUnreadNum = contactState.singleVerifyUnreadNum;
                break;
            case contactAction.isAgreeEnterGroupSuccess:
                this.verifyGroupList = contactState.verifyGroupList;
                break;
            case contactAction.isAgreeEnterGroupError:
                this.verifyGroupList = contactState.verifyGroupList;
                break;
            case chatAction.receiveGroupRefuseEventSuccess:
                this.store$.dispatch({
                    type: contactAction.dispatchContactUnreadNum,
                    payload: contactState.contactUnreadNum
                });
                this.verifyGroupList = contactState.verifyGroupList;
                this.verifyUnreadNum = contactState.verifyUnreadNum;
                this.groupVerifyUnreadNum = contactState.groupVerifyUnreadNum;
                this.singleVerifyUnreadNum = contactState.singleVerifyUnreadNum;
                break;
            case contactAction.changeVerifyTab:
                this.verifyTab = contactState.verifyTab;
                this.verifyUnreadNum = contactState.verifyUnreadNum;
                this.groupVerifyUnreadNum = contactState.groupVerifyUnreadNum;
                this.singleVerifyUnreadNum = contactState.singleVerifyUnreadNum;
                this.store$.dispatch({
                    type: contactAction.dispatchContactUnreadNum,
                    payload: contactState.contactUnreadNum
                });
                break;
            default:
        }
    }
    // 点击联系人
    private selectContactItemEmit(item) {
        this.store$.dispatch({
            type: contactAction.selectContactItem,
            payload: item
        });
        this.store$.dispatch({
            type: mainAction.changeListTab,
            payload: 0
        });
    }
    // 切换联系人中的tab
    private changeTabEmit(tab) {
        this.store$.dispatch({
            type: contactAction.changeTab,
            payload: tab
        });
    }
    // 同意或者拒绝好友请求
    private isAgreeAddFriendEmit(message) {
        this.store$.dispatch({
            type: contactAction.isAgreeAddFriend,
            payload: message
        });
    }
    // 查看验证信息中的对方用户的资料
    private watchVerifyUserEmit(message) {
        this.store$.dispatch({
            type: contactAction.watchVerifyUser,
            payload: message
        });
    }
    private isAgreeEnterGroupEmit(groupVerify) {
        this.store$.dispatch({
            type: contactAction.isAgreeEnterGroup,
            payload: groupVerify
        });
    }
    private watchGroupInfoEmit(verifyGroup) {
        this.store$.dispatch({
            type: contactAction.watchGroupInfo,
            payload: verifyGroup
        });
    }
    private changeVerifyTabEmit(tab) {
        this.store$.dispatch({
            type: contactAction.changeVerifyTab,
            payload: tab
        });
    }
}

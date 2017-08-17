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
    private conversation = [];
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
    private stateChanged(contactState) {
        switch (contactState.actionType) {
            case contactAction.getGroupListSuccess:
                this.groupList = contactState.groupList;
                break;
            case chatAction.createGroupSuccessEvent:

            case mainAction.createGroupSuccess:
                this.groupList = contactState.groupList;
                this.conversation = contactState.conversation;
                break;
            case chatAction.dispatchConversationList:
                this.conversation = contactState.conversation;
                break;
            case mainAction.createSingleChatSuccess:
                this.conversation = contactState.conversation;
                break;
            case chatAction.updateContactInfo:
                this.groupList = contactState.groupList;
                this.conversation = contactState.conversation;
                break;
            case mainAction.exitGroupSuccess:
                this.groupList = contactState.groupList;
                break;
            default:
        }
    }
    // 点击联系人
    private selectContactItemEmit(item) {
        if (!item.type) {
            item.type = 4;
        }
        this.store$.dispatch({
            type: contactAction.selectContactItem,
            payload: item
        });
    }
    private changeTabEmit(tab) {
        this.tab = tab;
    }
}

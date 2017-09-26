import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
const avatarErrorIcon = '../../../assets/images/single-avatar.svg';
import { Store } from '@ngrx/store';
import { chatAction } from '../../pages/chat/actions';
import { mainAction } from '../../pages/main/actions';
import { global } from '../../services/common';

@Component({
    selector: 'card-modal-component',
    templateUrl: './card-modal.component.html',
    styleUrls: ['./card-modal.component.scss']
})

export class CardModalComponent implements OnInit {
    @Input()
        private businessCard;
    @Output()
        private businessCardSend: EventEmitter<any> = new EventEmitter();
    private selectList = null;
    private searchResult = {
        result: [],
        show: false,
        keywords: ''
    };
    private businessCardStream$;
    constructor(
        private store$: Store<any>
    ) {
        // pass
     }
    public ngOnInit() {
        // pass
        console.log(0, this.businessCard);
        this.businessCardStream$ = this.store$.select((state) => {
            let chatState = state['chatReducer'];
            this.stateChanged(chatState);
            return state;
        }).subscribe((state) => {
            // pass
        });
    }
    private stateChanged(chatState) {
        switch (chatState.actionType) {
            case  mainAction.businessCardSearchComplete:
                console.log(666, chatState.businessCardSearch);
                if (chatState.businessCardSearch) {
                    if (chatState.businessCardSearch.name === global.user) {
                        chatState.businessCardSearch.disabled = true;
                    }
                    this.searchResult.result = [chatState.businessCardSearch];
                    this.searchResult.show = true;
                } else {
                    this.searchResult.result = [];
                    this.searchResult.show = true;
                }
                break;
            default:
        }
    }
    private cancelBusinessCard() {
        this.businessCard.show = false;
        for (let list of this.businessCard.info) {
            for (let item of list.data) {
                item.checked = false;
            }
        }
    }
    private confirmBusinessCard() {
        console.log(666666, this.selectList);
        this.businessCardSend.emit(this.selectList);
        this.businessCard.show = false;
        for (let list of this.businessCard.info) {
            for (let item of list.data) {
                item.checked = false;
            }
        }
    }
    private selectItem(user) {
        user.checked = !user.checked;
        if (user.checked) {
            this.selectList = user;
            for (let list of this.businessCard.info) {
                for (let item of list.data) {
                    if (user.name !== item.name) {
                        item.checked = false;
                    }
                }
            }
        } else {
            this.selectList = null;
        }
    }
    private cancelSelect() {
        this.selectList = null;
        for (let list of this.businessCard.info) {
            for (let item of list.data) {
                item.checked = false;
            }
        }
    }
    private searchKeyupEmit(keywords) {
        console.log(keywords);
        if (keywords === '') {
            this.searchResult.result = [];
            this.searchResult.show = false;
            return ;
        }
        let result = [];
        for (let item of this.businessCard.info) {
            for (let friend of item.data) {
                if (friend.memo_name &&
                    friend.memo_name.toLowerCase().indexOf(keywords.toLowerCase()) !== -1) {
                    result.push(friend);
                } else if (friend.nickName &&
                    friend.nickName.toLowerCase().indexOf(keywords.toLowerCase()) !== -1) {
                    result.push(friend);
                } else if (friend.name &&
                    friend.name.toLowerCase().indexOf(keywords.toLowerCase()) !== -1) {
                    result.push(friend);
                }
            }
        }
        console.log(result);
        this.searchResult.result = result;
        this.searchResult.show = true;
    }
    private clearInputEmit() {
        this.searchResult.show = false;
        this.searchResult.result = [];
        this.searchResult.keywords = '';
    }
    private searchBtnEmit(keywords) {
        console.log(keywords);
        this.store$.dispatch({
            type: mainAction.createGroupSearchAction,
            payload: {
                keywords,
                type: 'businessCard'
            }
        });
    }
    private hideSearch() {
        this.searchResult.show = false;
        this.searchResult.result = [];
        this.searchResult.keywords = '';
    }
    private changeCheckedEmit(user) {
        user.checked = !user.checked;
        if (user.checked) {
            this.selectList = user;
            for (let list of this.businessCard.info) {
                for (let item of list.data) {
                    if (user.name === item.name) {
                        item.checked = true;

                    } else {
                        item.checked = false;
                    }
                }
            }
        } else {
            this.selectList = null;
            for (let list of this.businessCard.info) {
                for (let item of list.data) {
                    item.checked = false;
                }
            }
        }
    }
    private avatarErrorIcon(event) {
        event.target.src = avatarErrorIcon;
    }
    private avatarLoad(event) {
        if (event.target.naturalHeight >= event.target.naturalWidth) {
            event.target.style.width = '100%';
            event.target.style.height = 'auto';
        } else {
            event.target.style.height = '100%';
            event.target.style.width = 'auto';
        }
    }
}

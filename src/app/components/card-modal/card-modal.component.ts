import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';
import { chatAction } from '../../pages/chat/actions';
import { mainAction } from '../../pages/main/actions';
import { global } from '../../services/common';
import { Util } from '../../services/util';
const avatarErrorIcon = '../../../assets/images/single-avatar.svg';

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
        if (this.selectList) {
            this.businessCardSend.emit(this.selectList);
            this.businessCard.show = false;
            for (let list of this.businessCard.info) {
                for (let item of list.data) {
                    item.checked = false;
                }
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
        this.searchResult.result = result;
        this.searchResult.show = true;
    }
    private clearInputEmit() {
        this.searchResult.show = false;
        this.searchResult.result = [];
        this.searchResult.keywords = '';
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
        Util.reduceAvatarSize(event);
    }
}

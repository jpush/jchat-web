import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
    constructor() {
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
                const memoName = friend.memo_name &&
                            friend.memo_name.toLowerCase().indexOf(keywords.toLowerCase()) !== -1;
                const nickName = friend.nickName &&
                            friend.nickName.toLowerCase().indexOf(keywords.toLowerCase()) !== -1;
                const name = friend.name &&
                            friend.name.toLowerCase().indexOf(keywords.toLowerCase()) !== -1;
                if (memoName || nickName || name) {
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
}

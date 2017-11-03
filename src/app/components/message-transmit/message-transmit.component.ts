import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { authPayload } from '../../services/common';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppStore } from '../../app.store';
import { mainAction } from '../../pages/main/actions';
import { chatAction } from '../../pages/chat/actions';
import { global } from '../../services/common';
import { Util } from '../../services/util';
const singleErrorIcon = '../../../assets/images/single-avatar.svg';
const groupErrorIcon = '../../../assets/images/group-avatar.svg';

@Component({
    selector: 'message-transmit-component',
    templateUrl: './message-transmit.component.html',
    styleUrls: ['./message-transmit.component.scss']
})

export class MessageTransmitComponent implements OnInit, OnDestroy {
    private messageTransmitStream$;
    @Input()
        private messageTransmit;
    @Output()
        private isMessageTransmit: EventEmitter<any> = new EventEmitter();
    @Output()
        private searchMessageTransmit: EventEmitter<any> = new EventEmitter();
    @Output()
        private confirmTransmit: EventEmitter<any> = new EventEmitter();
    private selectList = [];
    private searchResult = {
        result: {
            singleArr: [],
            groupArr: []
        },
        isSearch: false
    };
    constructor(
        private store$: Store<any>
    ) {
        // pass
    }
    public ngOnInit() {
        this.init();
        this.messageTransmitStream$ = this.store$.select((state) => {
            let chatState = state['chatReducer'];
            this.stateChanged(chatState);
            return state;
        }).subscribe((state) => {
            // pass
        });
    }
    public ngOnDestroy() {
        this.messageTransmitStream$.unsubscribe();
    }
    private init() {
        for ( let item of this.messageTransmit.list) {
            item.checked = false;
        }
    }
    private stateChanged(chatState) {
        switch (chatState.actionType) {
            case chatAction.searchMessageTransmit:
                this.searchResult = chatState.messageTransmit.searchResult;
                for (let item of this.searchResult.result.singleArr) {
                    item.checked = false;
                    for (let select of this.selectList) {
                        if (select.type === 3 && item.username === select.name) {
                            item.checked = true;
                        }
                    }
                    if (item.username === global.user) {
                        item.checked = true;
                        item.disabled = true;
                    }
                }
                for (let item of this.searchResult.result.groupArr) {
                    item.checked = false;
                    for (let select of this.selectList) {
                        if (select.type === 3 && Number(item.gid) === Number(select.key)) {
                            item.checked = true;
                        }
                    }
                }
                break;
            default:
        }
    }
    private searchKeyupEmit(value) {
        this.searchMessageTransmit.emit(value);
    }
    private changeInputEmit(item) {
        let flag = true;
        if (item.gid) {
            item.key = item.gid;
            item.type = 4;
        }
        for (let i = 0; i < this.selectList.length; i++) {
            if (item.type === 4 && Number(item.key) === Number(this.selectList[i].key)) {
                flag = false;
                this.selectList.splice(i, 1);
                item.checked = false;
                break;
            } else if (item.type === 3 && item.username === this.selectList[i].name) {
                flag = false;
                this.selectList.splice(i, 1);
                item.checked = false;
                break;
            }
        }
        if (flag) {
            item.checked = true;
            this.selectList.push(item);
        }
        for (let member of this.messageTransmit.list) {
            if (member.type === 4 && Number(item.key) === Number(member.key)) {
                member.checked = item.checked;
                break ;
            } else if (member.type === 3 && item.name === member.name) {
                member.checked = item.checked;
                item.key = member.key;
                break ;
            }
        }
    }
    private avatarErrorIcon(event, item) {
        event.target.src = item.type === 4 ? groupErrorIcon : singleErrorIcon;
    }
    private confirmMessageTransmit() {
        if (this.selectList.length > 0) {
            this.confirmTransmit.emit({
                type: this.messageTransmit.type,
                selectList: this.selectList
            });
            this.messageTransmit.show = false;
        }
    }
    private cancelMessageTransmit() {
        this.messageTransmit.show = false;
    }
    private selectItem(event, user) {
        if (!event.target.checked) {
            this.deleteItem(user);
        } else {
            if (user.name) {
                user.username = user.name;
            }
            user.flag = 0;
            this.selectList.push(user);
        }
        for (let member of this.messageTransmit.list) {
            if (member.type === 4 && Number(member.key) === Number(user.key)) {
                member.checked = event.target.checked;
                return ;
            } else if (member.type === 3 && member.name === user.name) {
                member.checked = event.target.checked;
                return ;
            }
        }
    }
    private cancelSelect(user) {
        this.deleteItem(user);
        for (let member of this.messageTransmit.list) {
            if (member.type === 4 && Number(member.key) === Number(user.key)) {
                member.checked = false;
                return ;
            } else if (member.type === 3 && member.name === user.name) {
                member.checked = false;
                return ;
            }
        }
    }
    // 删除已选元素操作
    private deleteItem(user) {
        for (let i = 0; i < this.selectList.length; i++) {
            if (this.selectList[i].type === 4 &&
                Number(this.selectList[i].key) === Number(user.key)) {
                this.selectList.splice(i, 1);
                break;
            } else if (this.selectList[i].type === 3 && this.selectList[i].name === user.name) {
                this.selectList.splice(i, 1);
                break;
            }
        }
    }
    private avatarLoad(event) {
        Util.reduceAvatarSize(event);
    }
}

import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { global, authPayload } from '../../services/common';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppStore } from '../../app.store';
import { mainAction } from '../../pages/main/actions';
import { chatAction } from '../../pages/chat/actions';
import { Util } from '../../services/util';

@Component({
    selector: 'create-group-component',
    templateUrl: './create-group.component.html',
    styleUrls: ['./create-group.component.scss']
})

export class CreateGroupComponent implements OnInit, OnDestroy {
    private global = global;
    private createGroupStream$;
    @Input()
    private createGroup;
    @Output()
    private isCreateGroup: EventEmitter<any> = new EventEmitter();
    @Output()
    private nextCreateGroup: EventEmitter<any> = new EventEmitter();
    private selectList = [];
    private searchResult = {
        result: [],
        show: false,
        checkbox: {
            show: true,
            list: []
        },
        keywords: '',
        placeholder: '搜索'
    };
    constructor(
        private store$: Store<any>
    ) { }
    public ngOnInit() {
        this.initData();
        this.createGroupStream$ = this.store$.select((state) => {
            const chatState = state['chatReducer'];
            this.stateChanged(chatState);
            return state;
        }).subscribe((state) => {
            // pass
        });
    }
    public ngOnDestroy() {
        this.createGroupStream$.unsubscribe();
    }
    private stateChanged(chatState) {
        switch (chatState.actionType) {
            case chatAction.createGroupSearchComplete:
                this.searchResult.show = true;
                let result = Util.deepCopyObj(chatState.createGroupSearch);
                if (result.length > 0) {
                    this.reducerSearchResult(result);
                }
                this.searchResult.result = result;
                break;
            default:
        }
    }
    // 处理搜索结果
    private reducerSearchResult(result) {
        for (let user of result) {
            // 如果搜索自己，disabled
            if (user.name === global.user) {
                user.disabled = true;
            }
            // 如果搜索的结果有已经disabled的、checked的
            for (let item of this.selectList) {
                if (user.name === item.name) {
                    user.checked = item.checked;
                    user.disabled = item.disabled;
                }
            }
            // 如果搜索的是已经在群里的，disabled
            const filter = this.createGroup.info.filter;
            if (filter) {
                for (let item of filter) {
                    if (item.username === user.name) {
                        user.disabled = true;
                        break;
                    }
                }
            }
            // 如果搜索的是创建多人会话的默认成员，disabled
            let activeSingle = this.createGroup.info.activeSingle;
            if (activeSingle &&
                activeSingle.name === user.name) {
                user.disabled = true;
            }
        }
    }
    private stopPropagation(event) {
        event.stopPropagation();
        this.searchResult.show = false;
        this.searchResult.keywords = '';
    }
    private initData() {
        // 多人会话
        for (let list of this.createGroup.list) {
            for (let member of list.data) {
                member.checked = false;
                member.disabled = false;
                member.show = true;
                let activeSingle = this.createGroup.info.activeSingle;
                const nameFlag = activeSingle && activeSingle.name === member.name;
                if (nameFlag) {
                    member.checked = true;
                    member.disabled = true;
                    this.createGroup.info.activeSingle.disabled = true;
                    this.createGroup.info.activeSingle.checked = true;
                }
            }
        }
        if (this.createGroup.info.activeSingle) {
            this.selectList.push(this.createGroup.info.activeSingle);
        }
        // 添加群成员，过滤掉已有成员
        if (this.createGroup.info.filter) {
            for (let list of this.createGroup.list) {
                for (let data of list.data) {
                    for (let filter of this.createGroup.info.filter) {
                        const nameFlag = filter.username === data.name;
                        if (nameFlag) {
                            data.show = false;
                            break;
                        }
                    }
                }
            }
        }
        // 如果整个letter的成员都不显示，则隐藏字母
        for (let list of this.createGroup.list) {
            let flag = false;
            for (let member of list.data) {
                if (member.show) {
                    flag = true;
                    break;
                }
            }
            list.allFilter = flag ? false : true;
        }
    }
    private searchKeyupEmit() {
        this.searchResult.result = [];
        this.searchResult.show = false;
    }
    private searchBtnEmit(keywords) {
        this.store$.dispatch({
            type: mainAction.createGroupSearchAction,
            payload: {
                keywords,
                type: 'createGroup'
            }
        });
    }
    private changeCheckedEmit(item) {
        let flag = true;
        for (let i = 0; i < this.selectList.length; i++) {
            if (item.name === this.selectList[i].name) {
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
        for (let list of this.createGroup.list) {
            for (let member of list.data) {
                if (item.name === member.name) {
                    member.checked = item.checked;
                    return;
                }
            }
        }
    }
    private clearInputEmit() {
        this.searchResult.show = false;
        this.searchResult.result = [];
    }
    private confirmCreateGroup() {
        let memberUsernames = [];
        for (let item of this.selectList) {
            memberUsernames.push({
                username: item.name,
                appkey: authPayload.appkey
            });
        }
        let groupInfo: any = {
            memberUsernames,
            detailMember: this.selectList,
            add: false
        };
        if (this.createGroup.info.action && this.createGroup.info.action === 'add') {
            groupInfo.add = true;
            groupInfo.activeGroup = this.createGroup.info.activeGroup;
        } else if (this.createGroup.info.action && this.createGroup.info.action === 'many') {
            groupInfo.groupName = this.createGroup.info.selfInfo.nickname ||
                this.createGroup.info.selfInfo.username;
            for (let item of this.selectList) {
                let name;
                if (item.nickName && item.nickName !== '') {
                    name = item.nickName;
                } else if (item.nickname && item.nickname !== '') {
                    name = item.nickname;
                } else if (item.username && item.username !== '') {
                    name = item.username;
                } else if (item.name && item.name !== '') {
                    name = item.name;
                }
                groupInfo.groupName += '、' + name;
            }
            groupInfo.groupName = groupInfo.groupName.substr(0, 20);
        }
        this.isCreateGroup.emit(groupInfo);
    }
    private nextCreateGroupAction() {
        let memberUsernames = [];
        for (let item of this.selectList) {
            memberUsernames.push({
                username: item.name,
                appkey: authPayload.appkey
            });
        }
        const groupInfo = {
            memberUsernames,
            detailMember: this.selectList
        };
        this.nextCreateGroup.emit(groupInfo);
    }
    private cancelCreateGroup(event) {
        event.stopPropagation();
        this.isCreateGroup.emit();
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
        for (let list of this.createGroup.list) {
            for (let member of list.data) {
                if (member.name === user.name) {
                    member.checked = event.target.checked;
                    return;
                }
            }
        }
    }
    private cancelSelect(user) {
        this.deleteItem(user);
        for (let list of this.createGroup.list) {
            for (let member of list.data) {
                if (member.name === user.name) {
                    member.checked = false;
                    return;
                }
            }
        }
    }
    // 删除已选元素操作
    private deleteItem(user) {
        for (let i = 0; i < this.selectList.length; i++) {
            if (this.selectList[i].name === user.name) {
                this.selectList.splice(i, 1);
                break;
            }
        }
    }
}

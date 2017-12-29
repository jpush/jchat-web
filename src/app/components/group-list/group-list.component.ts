import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'group-list-component',
    templateUrl: './group-list.component.html',
    styleUrls: ['./group-list.component.scss']
})

export class GroupListComponent implements OnInit {
    @Input()
    private groupLoading;
    @Input()
    private groupList;
    @Input()
    private set groupFlag(value) {
        this.checkGroupList();
    }
    @Output()
    private selectGroupItemEmit: EventEmitter<any> = new EventEmitter();
    private isEmpty = false;
    constructor() {
        // pass
    }
    public ngOnInit() {
        if (!this.groupList) {
            this.groupList = [];
        }
    }
    public checkGroupList() {
        let flag = true;
        for (let item of this.groupList) {
            if (item.data.length > 0) {
                this.isEmpty = true;
                flag = false;
                break;
            }
        }
        if (flag) {
            this.isEmpty = false;
        }
    }
    private selectGroupItem(item) {
        item.type = 4;
        this.selectGroupItemEmit.emit(item);
    }
}

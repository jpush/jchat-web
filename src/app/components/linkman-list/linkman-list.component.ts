import { Component, OnInit, Input, Output, EventEmitter, DoCheck } from '@angular/core';

@Component({
    selector: 'linkman-list-component',
    templateUrl: './linkman-list.component.html',
    styleUrls: ['./linkman-list.component.scss']
})

export class LinkmanListComponent implements OnInit, DoCheck {
    @Input()
        private friendList;
    @Output()
        private selectLinkmanItemEmit: EventEmitter<any> = new EventEmitter();
    private isEmpty = false;
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    public ngDoCheck() {
        let flag = true;
        for (let item of this.friendList) {
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
    private selectLinkmanItem(item) {
        item.type = 3;
        this.selectLinkmanItemEmit.emit(item);
    }
}

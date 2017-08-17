import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'select-component',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.scss']
})

export class SelectComponent implements OnInit {
    @Input()
        private selectList;
    constructor() {
        // pass
     }
    public ngOnInit() {
        // pass
    }
    private showList(event) {
        event.stopPropagation();
        if (this.selectList.show === false) {
            this.selectList.show = true;
        } else {
            this.selectList.show = false;
        }
    }
    private changeItemAction(item) {
        this.selectList.active = item;
    }
}

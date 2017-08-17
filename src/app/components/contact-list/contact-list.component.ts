import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'contact-list-component',
    templateUrl: './contact-list.component.html',
    styleUrls: ['./contact-list.component.scss']
})

export class ContactListComponent implements OnInit {
    private listIndex = 1;
    @Output()
        private changeTab: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    private changeList(index) {
        this.listIndex = index;
        this.changeTab.emit(index);
    }
}

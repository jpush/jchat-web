import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { global } from '../../services/common';

@Component({
    selector: 'at-list-component',
    templateUrl: './at-list.component.html',
    styleUrls: ['./at-list.component.scss']
})

export class AtListComponent implements OnInit {
    @Input()
    private atList: EventEmitter<any> = new EventEmitter();
    @Output()
    private selectAtItem: EventEmitter<any> = new EventEmitter();
    private global = global;
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    private selectPerson(item, event) {
        this.selectAtItem.emit(item);
        event.stopPropagation();
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
}

import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { global } from '../../services/common';

@Component({
    selector: 'conversation-list-component',
    templateUrl: './conversation-list.component.html',
    styleUrls: ['./conversation-list.component.scss']
})

export class ConversationListComponent implements OnInit {
    @Input()
    private conversationList;
    @Input()
    private active;
    @Output()
    private changeActive: EventEmitter<any> = new EventEmitter();
    @Output()
    private deleteConversationItem: EventEmitter<any> = new EventEmitter();
    @Output()
    private conversationToTop: EventEmitter<any> = new EventEmitter();
    private global = global;
    private topPosition = {
        left: 0,
        top: 0,
        show: false,
        item: {}
    };
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    @HostListener('window:click') private onClickWindow() {
        this.topPosition.show = false;
    }
    private selectTarget(item) {
        this.changeActive.emit(item);
    }
    private deleteThis(event, item) {
        event.stopPropagation();
        this.deleteConversationItem.emit(item);
    }
    private contextmenu(event, item) {
        this.topPosition = {
            top: event.clientY,
            left: event.clientX,
            show: true,
            item
        };
        return false;
    }
    private conversationToTopAction() {
        this.conversationToTop.emit(this.topPosition.item);
    }
}

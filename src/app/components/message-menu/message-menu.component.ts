import {
    Component, OnInit, Input, Output, EventEmitter,
    HostListener, AfterViewInit
} from '@angular/core';
import * as Clipboard from 'clipboard/dist/clipboard.min.js';

@Component({
    selector: 'message-menu-component',
    templateUrl: './message-menu.component.html',
    styleUrls: ['./message-menu.component.scss']
})

export class MessageMenuComponent implements OnInit, AfterViewInit {
    @Input()
    private menu;
    @Output()
    private selectMenuItem: EventEmitter<any> = new EventEmitter();
    @Output()
    private menuItemEnter: EventEmitter<any> = new EventEmitter();
    @Output()
    private menuItemLeave: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    public ngAfterViewInit() {
        const clipboard = new Clipboard('.message-copy');
    }
    private selectMenuItemAction(item) {
        this.selectMenuItem.emit(item);
    }
    private itemEnter() {
        this.menu.show = true;
        this.menuItemEnter.emit();
    }
    private itemLeave() {
        this.menu.show = false;
        this.menuItemLeave.emit();
    }
}

import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
    selector: 'menu-component',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss']
})

export class MenuComponent implements OnInit {
    @Input()
        private menu;
    @Output()
        private selectMenuItem: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
     }
    public ngOnInit() {
        // pass
        console.log(222, this.menu);
    }
    private selectMenuItemAction(item) {
        this.selectMenuItem.emit(item);
    }
}

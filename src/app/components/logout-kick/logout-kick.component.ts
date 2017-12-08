import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'logout-kick-component',
    templateUrl: './logout-kick.component.html',
    styleUrls: ['./logout-kick.component.scss']
})

export class LogoutKickComponent implements OnInit {
    @Input()
    private info;
    @Output()
    private modalTipEmit: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
    private modalTip(event, info) {
        event.stopPropagation();
        if (info) {
            this.modalTipEmit.emit(info);
        } else {
            this.modalTipEmit.emit();
        }
    }
}

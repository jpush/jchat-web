import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'hover-tip-component',
    templateUrl: './hover-tip.component.html',
    styleUrls: ['./hover-tip.component.scss']
})

export class HoverTipComponent implements OnInit {
    @Input()
    private hoverInfo;
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
}

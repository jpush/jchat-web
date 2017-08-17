import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'switch-component',
    templateUrl: './switch.component.html',
    styleUrls: ['./switch.component.scss']
})

export class SwitchComponent implements OnInit {
    @Input()
        private state;
    @Output()
        private changeSwitch: EventEmitter<any> = new EventEmitter();
    constructor(
    ) {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    private changeSwitchAction() {
        this.changeSwitch.emit();
    }
}

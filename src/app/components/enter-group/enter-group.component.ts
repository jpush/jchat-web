import { Component, Input, Output, EventEmitter, ElementRef,
    AfterViewInit, OnInit } from '@angular/core';

@Component({
    selector: 'enter-group-component',
    templateUrl: './enter-group.component.html',
    styleUrls: ['./enter-group.component.scss']
})

export class EnterGroupComponent implements OnInit, AfterViewInit {
    @Input()
        private enterPublicGroup;
    @Output()
        private enterGroupComfirm: EventEmitter<any> = new EventEmitter();
    @Output()
        private emptyEnterGroupTip: EventEmitter<any> = new EventEmitter();
    constructor(
        private elementRef: ElementRef
    ) {}
    public ngOnInit() {
        // pass
    }
    public ngAfterViewInit() {
        this.elementRef.nativeElement.querySelector('#enterGroup').focus();
    }
    private closeEnterGroup() {
        this.enterPublicGroup.show = false;
    }
    private confirmEnterGroup(input) {
        if (input.value.length > 0) {
            this.enterGroupComfirm.emit(input.value);
        }
    }
    private inputKeyup(event, input) {
        if (event.keyCode === 13) {
            this.confirmEnterGroup(input);
        } else {
            this.emptyEnterGroupTip.emit();
        }
    }
}

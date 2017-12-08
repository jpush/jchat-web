import {
    Component, Input, Output, EventEmitter, ElementRef,
    AfterViewInit, OnInit, ViewChild
} from '@angular/core';

@Component({
    selector: 'enter-group-component',
    templateUrl: './enter-group.component.html',
    styleUrls: ['./enter-group.component.scss']
})

export class EnterGroupComponent implements OnInit, AfterViewInit {
    @ViewChild('enterGroupInput') private enterGroupInput;
    @Input()
    private enterPublicGroup;
    @Output()
    private enterGroupComfirm: EventEmitter<any> = new EventEmitter();
    @Output()
    private emptyEnterGroupTip: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    public ngAfterViewInit() {
        this.enterGroupInput.nativeElement.focus();
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

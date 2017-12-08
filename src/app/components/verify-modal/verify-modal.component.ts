import {
    Component, OnInit, Input, Output,
    EventEmitter, AfterViewInit, ViewChild
} from '@angular/core';

@Component({
    selector: 'verify-modal-component',
    templateUrl: './verify-modal.component.html',
    styleUrls: ['./verify-modal.component.scss']
})

export class VerifyModalComponent implements OnInit, AfterViewInit {
    @ViewChild('verifyModalTextarea') private verifyModalTextarea;
    @Input()
    private verifyModal;
    @Output()
    private verifyModalBtn: EventEmitter<any> = new EventEmitter();
    private modelText = '';
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    public ngAfterViewInit() {
        this.verifyModalTextarea.nativeElement.focus();
    }
    private verifyModalAction(modelText) {
        this.verifyModalBtn.emit(modelText);
    }
    private closeModal() {
        this.verifyModal.show = false;
    }
}

import { Component, OnInit, Input, Output,
    EventEmitter, AfterViewInit, ElementRef } from '@angular/core';

@Component({
    selector: 'verify-modal-component',
    templateUrl: './verify-modal.component.html',
    styleUrls: ['./verify-modal.component.scss']
})

export class VerifyModalComponent implements OnInit, AfterViewInit {
    @Input()
        private verifyModal;
    @Output()
        private verifyModalBtn: EventEmitter<any> = new EventEmitter();
    private modelText = '';
    constructor(
        private elementRef: ElementRef
    ) {
        // pass
     }
    public ngOnInit() {
        // pass
    }
    public ngAfterViewInit() {
        this.elementRef.nativeElement.querySelector('#verifyModalTextarea').focus();
    }
    private verifyModalAction(modelText) {
        this.verifyModalBtn.emit(modelText);
    }
    private closeModal() {
        this.verifyModal.show = false;
    }
}

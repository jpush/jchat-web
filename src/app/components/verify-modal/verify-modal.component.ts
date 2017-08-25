import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'verify-modal-component',
    templateUrl: './verify-modal.component.html',
    styleUrls: ['./verify-modal.component.scss']
})

export class VerifyModalComponent implements OnInit {
    @Output()
        private verifyModalBtn: EventEmitter<any> = new EventEmitter();
    private modelText = '';
    constructor() {
        // pass
     }
    public ngOnInit() {
        // pass
    }
    private verifyModalAction(modelText ?) {
        this.verifyModalBtn.emit(modelText);
    }
}

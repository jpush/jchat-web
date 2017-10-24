import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'paste-image-component',
    templateUrl: './paste-image.component.html',
    styleUrls: ['./paste-image.component.scss']
})

export class PasteImageComponent implements OnInit {
    @Input()
        private pasteInfo;
    @Output()
        private pasteImage: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
     }
    public ngOnInit() {
        // pass
    }
    private pasteModalAction(type ?) {
        this.pasteInfo.show = false;
        if (type) {
            this.pasteImage.emit();
        }
    }
}

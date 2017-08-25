import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'drop-file-component',
    templateUrl: './drop-file.component.html',
    styleUrls: ['./drop-file.component.scss']
})

export class DropFileComponent implements OnInit {
    @Input()
        private dropFileInfo;
    @Output()
        private dropFile: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
     }
    public ngOnInit() {
        let index = this.dropFileInfo.info.name.lastIndexOf('.');
        if (index !== -1) {
            this.dropFileInfo.info.ext = this.dropFileInfo.info.name.substring(index + 1);
        }
    }
    private dropFileAction(type ?) {
        this.dropFileInfo.show = false;
        if (type) {
            this.dropFile.emit();
        }
    }
}

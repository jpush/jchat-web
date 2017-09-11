import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'group-description-component',
    templateUrl: './group-description.component.html',
    styleUrls: ['./group-description.component.scss']
})

export class GroupDescriptionComponent implements OnInit {
    @Input()
        private description;
    @Output()
        private updateGroupInfo: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
    private groupAction(desc) {
        console.log(6666, desc);
        if (desc) {
            desc.actionType = 'modifyDescription';
            this.updateGroupInfo.emit(desc);
        } else {
            this.updateGroupInfo.emit();
        }
    }
}

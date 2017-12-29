import {
    Component, OnInit, Input, Output,
    EventEmitter, AfterViewInit, ViewChild
} from '@angular/core';

@Component({
    selector: 'group-description-component',
    templateUrl: './group-description.component.html',
    styleUrls: ['./group-description.component.scss']
})

export class GroupDescriptionComponent implements OnInit, AfterViewInit {
    @ViewChild('groupDescrptionTextarea') private groupDescrptionTextarea;
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
    public ngAfterViewInit() {
        this.groupDescrptionTextarea.nativeElement.focus();
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
    private groupAction(event, desc) {
        event.stopPropagation();
        if (desc) {
            desc.actionType = 'modifyDescription';
            this.updateGroupInfo.emit(desc);
        } else {
            this.updateGroupInfo.emit();
        }
    }
}

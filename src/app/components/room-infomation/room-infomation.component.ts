import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
    selector: 'room-infomation-component',
    templateUrl: './room-infomation.component.html',
    styleUrls: ['./room-infomation.component.scss']
})

export class RoomInfomationComponent implements OnInit {
    @Input()
    private roomInfomation;
    @Output()
    private hideRoomInfomation: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    private closeRoomInfomation() {
        this.hideRoomInfomation.emit();
    }
    @HostListener('window:click') private onWindowClick() {
        this.hideRoomInfomation.emit();
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
}

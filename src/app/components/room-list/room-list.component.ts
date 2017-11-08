import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'room-list-component',
    templateUrl: './room-list.component.html',
    styleUrls: ['./room-list.component.scss']
})

export class RoomListComponent implements OnInit {
    @Input()
        private roomList;
    @Input()
        private active;
    @Output()
        private changeRoom: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
     }
    public ngOnInit() {
        // pass
    }
    private changeRoomAction(room) {
        this.changeRoom.emit(room);
    }
}

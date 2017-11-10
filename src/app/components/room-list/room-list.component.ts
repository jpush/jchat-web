import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'room-list-component',
    templateUrl: './room-list.component.html',
    styleUrls: ['./room-list.component.scss']
})

export class RoomListComponent implements OnInit {
    @Input()
    set loadMoreRoomsFlag(value) {
        this.flag = false;
    }
    @Input()
        private roomList;
    @Input()
        private active;
    @Output()
        private changeRoom: EventEmitter<any> = new EventEmitter();
    @Output()
        private loadMoreRooms: EventEmitter<any> = new EventEmitter();
    private flag = false;
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    private changeRoomAction(room) {
        this.changeRoom.emit(room);
    }
    private scrollBottomEvent() {
        if (this.roomList.length > 0 && !this.flag) {
            this.flag = true;
            this.loadMoreRooms.emit();
        }
    }
}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RoomComponent } from './room.component';
import { RoomListModule } from '../../components/room-list';
import { RoomInfomationModule } from '../../components/room-infomation';
import { RoomDetailModule } from '../../components/room-detail';

@NgModule({
  declarations: [
    RoomComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RoomListModule,
    RoomInfomationModule,
    RoomDetailModule
  ],
  exports: [
      RoomComponent
  ],
  providers: []
})
export class RoomModule {}

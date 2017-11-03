import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RoomListComponent } from './room-list.component';

@NgModule({
  declarations: [
    RoomListComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      RoomListComponent
  ],
  providers: []
})

export class RoomListModule {}

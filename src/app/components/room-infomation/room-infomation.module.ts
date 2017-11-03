import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { RoomInfomationComponent } from './room-infomation.component';

@NgModule({
  declarations: [
    RoomInfomationComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      RoomInfomationComponent
  ],
  providers: []
})

export class RoomInfomationModule {}

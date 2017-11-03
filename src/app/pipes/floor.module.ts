import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { FloorPipe } from './floor.pipe';

@NgModule({
  declarations: [
    FloorPipe
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      FloorPipe
  ],
  providers: []
})
export class FloorPipeModule {}

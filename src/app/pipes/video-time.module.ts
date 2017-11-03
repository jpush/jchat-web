import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { VideoTimePipe } from './video-time.pipe';

@NgModule({
  declarations: [
    VideoTimePipe
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      VideoTimePipe
  ],
  providers: []
})
export class VideoTimePipeModule {}

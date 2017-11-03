import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { TimePipe } from './time.pipe';

@NgModule({
  declarations: [
    TimePipe
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      TimePipe
  ],
  providers: []
})
export class TimePipeModule {}

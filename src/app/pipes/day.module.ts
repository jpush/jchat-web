import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { DayPipe } from './day.pipe';

@NgModule({
  declarations: [
    DayPipe
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      DayPipe
  ],
  providers: []
})
export class DayPipeModule {}

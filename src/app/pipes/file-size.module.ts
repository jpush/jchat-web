import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { FileSizePipe } from './file-size.pipe';

@NgModule({
  declarations: [
    FileSizePipe
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      FileSizePipe
  ],
  providers: []
})
export class FileSizePipeModule {}

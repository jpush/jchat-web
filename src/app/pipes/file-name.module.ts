import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { FileNamePipe } from './file-name.pipe';

@NgModule({
  declarations: [
    FileNamePipe
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      FileNamePipe
  ],
  providers: []
})
export class FileNamePipeModule {}

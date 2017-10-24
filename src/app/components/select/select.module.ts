import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { SelectComponent } from './select.component';

@NgModule({
  declarations: [
    SelectComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      SelectComponent
  ],
  providers: []
})
export class SelectModule {}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { BlackMenuComponent } from './black-menu.component';

@NgModule({
  declarations: [
    BlackMenuComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      BlackMenuComponent
  ],
  providers: []
})
export class BlackMenuModule {}

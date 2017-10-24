import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { InfoMenuComponent } from './info-menu.component';

@NgModule({
  declarations: [
    InfoMenuComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      InfoMenuComponent
  ],
  providers: []
})
export class InfoMenuModule {}

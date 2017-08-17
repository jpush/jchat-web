import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { GroupDescriptionComponent } from './group-description.component';

@NgModule({
  declarations: [
    GroupDescriptionComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      GroupDescriptionComponent
  ],
  providers: []
})
export class GroupDescriptionModule {}
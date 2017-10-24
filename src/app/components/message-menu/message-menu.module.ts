import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { MessageMenuComponent } from './message-menu.component';

@NgModule({
  declarations: [
    MessageMenuComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      MessageMenuComponent
  ],
  providers: []
})
export class MessageMenuModule {}

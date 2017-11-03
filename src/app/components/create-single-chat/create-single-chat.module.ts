import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CreateSingleChatComponent } from './create-single-chat.component';

@NgModule({
  declarations: [
    CreateSingleChatComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      CreateSingleChatComponent
  ],
  providers: []
})

export class CreateSingleChatModule {}
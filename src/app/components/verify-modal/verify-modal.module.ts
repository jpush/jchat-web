import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { VerifyModalComponent } from './verify-modal.component';

@NgModule({
  declarations: [
    VerifyModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      VerifyModalComponent
  ],
  providers: []
})

export class VerifyModalModule {}

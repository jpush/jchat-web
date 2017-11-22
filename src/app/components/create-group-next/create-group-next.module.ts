import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CreateGroupNextComponent } from './create-group-next.component';

@NgModule({
  declarations: [
    CreateGroupNextComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      CreateGroupNextComponent
  ],
  providers: []
})

export class CreateGroupNextModule {}

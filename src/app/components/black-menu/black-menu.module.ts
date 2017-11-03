import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { BlackMenuComponent } from './black-menu.component';
import { SanitizePipeModule } from '../../pipes';

@NgModule({
  declarations: [
    BlackMenuComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SanitizePipeModule
  ],
  exports: [
      BlackMenuComponent
  ],
  providers: []
})

export class BlackMenuModule {}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { LogoutKickComponent } from './logout-kick.component';

@NgModule({
  declarations: [
    LogoutKickComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      LogoutKickComponent
  ],
  providers: []
})

export class LogoutKickModule {}
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { UnreadListComponent } from './unread-list.component';
import { SanitizePipeModule } from '../../pipes';

@NgModule({
  declarations: [
    UnreadListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PerfectScrollbarModule.forRoot(PERFECT_SCROLLBAR_CONFIG),
    SanitizePipeModule
  ],
  exports: [
      UnreadListComponent
  ],
  providers: []
})

export class UnreadListModule {}

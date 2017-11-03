import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { GroupListComponent } from './group-list.component';
import { SanitizePipeModule } from '../../pipes';

@NgModule({
  declarations: [
    GroupListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PerfectScrollbarModule.forRoot(PERFECT_SCROLLBAR_CONFIG),
    SanitizePipeModule
  ],
  exports: [
      GroupListComponent
  ],
  providers: []
})

export class GroupListModule {}
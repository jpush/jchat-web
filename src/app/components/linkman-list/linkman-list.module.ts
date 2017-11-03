import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { LinkmanListComponent } from './linkman-list.component';
import { SanitizePipeModule } from '../../pipes';

@NgModule({
  declarations: [
    LinkmanListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PerfectScrollbarModule.forRoot(PERFECT_SCROLLBAR_CONFIG),
    SanitizePipeModule
  ],
  exports: [
      LinkmanListComponent
  ],
  providers: []
})

export class LinkmanListModule {}
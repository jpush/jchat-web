import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { CreateGroupComponent } from './create-group.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { SearchMemberModule } from '../search-member';
import { SanitizePipeModule } from '../../pipes';

@NgModule({
  declarations: [
    CreateGroupComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
     PerfectScrollbarModule.forRoot(PERFECT_SCROLLBAR_CONFIG),
     SearchMemberModule,
     SanitizePipeModule
  ],
  exports: [
      CreateGroupComponent
  ],
  providers: []
})
export class CreateGroupModule {}
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { GroupSettingComponent } from './group-setting.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { SwitchModule } from '../switch';
import { HoverEventModule } from '../../directives';
import { HoverTipModule } from '../hover-tip';
import { SearchMemberModule } from '../search-member';
import { EllipsisPipeModule, SanitizePipeModule } from '../../pipes';

@NgModule({
  declarations: [
    GroupSettingComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PerfectScrollbarModule.forRoot(PERFECT_SCROLLBAR_CONFIG),
    SwitchModule,
    HoverEventModule,
    HoverTipModule,
    SearchMemberModule,
    EllipsisPipeModule,
    SanitizePipeModule
  ],
  exports: [
      GroupSettingComponent
  ],
  providers: []
})

export class GroupSettingModule {}
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { GroupSettingComponent } from './group-setting.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { SwitchModule } from '../switch';
import { HoverTipModule } from '../hover-tip';
import { SearchMemberModule } from '../search-member';
import { SharedPipeModule } from '../../pipes';
import { SharedDirectiveModule } from '../../directives';

@NgModule({
    declarations: [
        GroupSettingComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        PerfectScrollbarModule.forRoot(PERFECT_SCROLLBAR_CONFIG),
        SwitchModule,
        HoverTipModule,
        SearchMemberModule,
        SharedPipeModule,
        SharedDirectiveModule
    ],
    exports: [
        GroupSettingComponent
    ],
    providers: []
})

export class GroupSettingModule { }

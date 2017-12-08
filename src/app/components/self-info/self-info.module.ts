import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { SelfInfoComponent } from './self-info.component';
import { SelectModule } from '../select';
import { InfoMenuModule } from '../info-menu';
import { GroupAvatarModule } from '../group-avatar';
import { SharedPipeModule } from '../../pipes';
import { SharedDirectiveModule } from '../../directives';

@NgModule({
    declarations: [
        SelfInfoComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        SelectModule,
        SharedPipeModule,
        InfoMenuModule,
        GroupAvatarModule,
        SharedDirectiveModule
    ],
    exports: [
        SelfInfoComponent
    ],
    providers: []
})

export class SelfInfoModule { }

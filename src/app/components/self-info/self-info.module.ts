import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { SelfInfoComponent } from './self-info.component';
import { SelectModule } from '../select';
import { EllipsisPipeModule, SanitizePipeModule } from '../../pipes';
import { InfoMenuModule } from '../info-menu';
import { GroupAvatarModule } from '../group-avatar';
import { AvatarLoadModule, AvatarErrorModule } from '../../directives';

@NgModule({
    declarations: [
        SelfInfoComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        SelectModule,
        EllipsisPipeModule,
        SanitizePipeModule,
        InfoMenuModule,
        GroupAvatarModule,
        AvatarLoadModule,
        AvatarErrorModule
    ],
    exports: [
        SelfInfoComponent
    ],
    providers: []
})

export class SelfInfoModule {}

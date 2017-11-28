import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { OtherInfoComponent } from './other-info.component';
import { HoverTipModule } from '../hover-tip';
import { HoverEventModule, AvatarLoadModule, AvatarErrorModule } from '../../directives';
import { EllipsisPipeModule, SanitizePipeModule } from '../../pipes';
import { InfoMenuModule } from '../info-menu';

@NgModule({
    declarations: [
        OtherInfoComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        HoverTipModule,
        HoverEventModule,
        EllipsisPipeModule,
        SanitizePipeModule,
        InfoMenuModule,
        AvatarLoadModule,
        AvatarErrorModule
    ],
    exports: [
        OtherInfoComponent
    ],
    providers: []
})

export class OtherInfoModule {}

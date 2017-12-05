import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { OtherInfoComponent } from './other-info.component';
import { HoverTipModule } from '../hover-tip';
import { InfoMenuModule } from '../info-menu';
import { SharedPipeModule } from '../../pipes';
import { SharedDirectiveModule } from '../../directives';

@NgModule({
    declarations: [
        OtherInfoComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        HoverTipModule,
        SharedDirectiveModule,
        SharedPipeModule,
        InfoMenuModule,
    ],
    exports: [
        OtherInfoComponent
    ],
    providers: []
})

export class OtherInfoModule {}

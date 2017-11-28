import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { SearchTransmitComponent } from './search-transmit.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { SanitizePipeModule } from '../../pipes';
import { AvatarLoadModule, AvatarErrorModule } from '../../directives';

@NgModule({
    declarations: [
        SearchTransmitComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        PerfectScrollbarModule.forRoot(PERFECT_SCROLLBAR_CONFIG),
        SanitizePipeModule,
        AvatarLoadModule,
        AvatarErrorModule
    ],
    exports: [
        SearchTransmitComponent
    ],
    providers: []
})

export class SearchTransmitModule {}

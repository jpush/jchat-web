import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { SearchCardComponent } from './search-card.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { SanitizePipeModule } from '../../pipes';
import { AvatarLoadModule, AvatarErrorModule } from '../../directives';

@NgModule({
    declarations: [
        SearchCardComponent
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
        SearchCardComponent
    ],
    providers: []
})

export class SearchCardModule {}

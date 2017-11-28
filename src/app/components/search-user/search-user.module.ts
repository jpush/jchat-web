import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { SearchUserComponent } from './search-user.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { SanitizePipeModule } from '../../pipes';
import { AvatarLoadModule, AvatarErrorModule } from '../../directives';

@NgModule({
    declarations: [
        SearchUserComponent
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
        SearchUserComponent
    ],
    providers: []
})

export class SearchUserModule {}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { GroupInfoComponent } from './group-info.component';
import { EllipsisPipeModule } from '../../pipes';
import { AvatarLoadModule, AvatarErrorModule } from '../../directives';

@NgModule({
    declarations: [
        GroupInfoComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        EllipsisPipeModule,
        AvatarLoadModule,
        AvatarErrorModule
    ],
    exports: [
        GroupInfoComponent
    ],
    providers: []
})

export class GroupInfoModule {}

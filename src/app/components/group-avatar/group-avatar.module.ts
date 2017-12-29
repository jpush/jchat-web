import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { GroupAvatarComponent } from './group-avatar.component';

@NgModule({
    declarations: [
        GroupAvatarComponent
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        GroupAvatarComponent
    ],
    providers: []
})

export class GroupAvatarModule { }

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { GroupInfoComponent } from './group-info.component';
import { SharedPipeModule } from '../../pipes';
import { SharedDirectiveModule } from '../../directives';

@NgModule({
    declarations: [
        GroupInfoComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        SharedPipeModule,
        SharedDirectiveModule
    ],
    exports: [
        GroupInfoComponent
    ],
    providers: []
})

export class GroupInfoModule {}

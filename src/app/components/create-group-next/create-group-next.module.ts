import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { CreateGroupNextComponent } from './create-group-next.component';
import { AvatarLoadModule, AvatarErrorModule } from '../../directives';

@NgModule({
    declarations: [
        CreateGroupNextComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        AvatarLoadModule,
        AvatarErrorModule
    ],
    exports: [
        CreateGroupNextComponent
    ],
    providers: []
})

export class CreateGroupNextModule {}

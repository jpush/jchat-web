import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RoomComponent } from './room.component';
import { SharedComponentModule } from '../../components/shared';

@NgModule({
    declarations: [
        RoomComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        SharedComponentModule
    ],
    exports: [
        RoomComponent
    ],
    providers: []
})
export class RoomModule { }

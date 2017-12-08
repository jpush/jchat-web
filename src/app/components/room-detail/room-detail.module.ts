import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RoomDetailComponent } from './room-detail.component';

@NgModule({
    declarations: [
        RoomDetailComponent
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        RoomDetailComponent
    ],
    providers: []
})

export class RoomDetailModule { }

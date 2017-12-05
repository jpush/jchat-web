import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { ChatComponent } from './chat.component';
import { SharedComponentModule } from '../../components/shared';

@NgModule({
    declarations: [
        ChatComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        SharedComponentModule
    ],
    exports: [
        ChatComponent
    ],
    providers: [
    ]
})
export class ChatModule {}

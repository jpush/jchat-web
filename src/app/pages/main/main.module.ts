import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MAIN_ROUTER } from './main.router';
import { MainComponent } from './main.component';
import { ChatModule } from '../chat';
import { ContactModule } from '../contact';
import { RoomModule } from '../room';
import { SharedComponentModule } from '../../components/shared';
import { SharedPipeModule } from '../../pipes';
import { SharedDirectiveModule } from '../../directives';

@NgModule({
    declarations: [
        MainComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(MAIN_ROUTER),
        SharedComponentModule,
        ChatModule,
        ContactModule,
        RoomModule,
        SharedPipeModule,
        SharedDirectiveModule
    ],
    providers: [
    ]
})
export class MainModule {
  public static routes = MAIN_ROUTER;
}

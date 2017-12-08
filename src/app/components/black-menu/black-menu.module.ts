import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { BlackMenuComponent } from './black-menu.component';
import { SharedPipeModule } from '../../pipes';
import { SharedDirectiveModule } from '../../directives';

@NgModule({
    declarations: [
        BlackMenuComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        SharedPipeModule,
        SharedDirectiveModule
    ],
    exports: [
        BlackMenuComponent
    ],
    providers: []
})

export class BlackMenuModule { }

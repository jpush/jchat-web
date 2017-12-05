import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { MenuComponent } from './menu.component';

@NgModule({
    declarations: [
        MenuComponent
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        MenuComponent
    ],
    providers: []
})

export class MenuModule {}

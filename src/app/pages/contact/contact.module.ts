import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { ContactComponent } from './contact.component';
import { SharedComponentModule } from '../../components/shared';

@NgModule({
    declarations: [
        ContactComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        SharedComponentModule
    ],
    exports: [
        ContactComponent
    ],
    providers: []
})
export class ContactModule {}

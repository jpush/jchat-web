import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { MessageFileComponent } from './message-file.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from '../../services/common';
import { FileSizePipeModule, FileTypePipeModule,
  DatePipeModule, FileNamePipeModule } from '../../pipes';

@NgModule({
    declarations: [
        MessageFileComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        PerfectScrollbarModule.forRoot(PERFECT_SCROLLBAR_CONFIG),
        FileSizePipeModule,
        FileTypePipeModule,
        DatePipeModule,
        FileNamePipeModule
    ],
    exports: [
        MessageFileComponent
    ],
    providers: []
})

export class MessageFileModule {}

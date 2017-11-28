import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { EmojiPipe } from './emoji.pipe';

@NgModule({
    declarations: [
        EmojiPipe
    ],
    imports: [
        CommonModule,
        FormsModule
    ],
    exports: [
        EmojiPipe
    ],
    providers: []
})
export class EmojiPipeModule {}

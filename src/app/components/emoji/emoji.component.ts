import { Component, OnInit, Input, Output, EventEmitter,
    HostListener, ElementRef } from '@angular/core';
import { Util } from '../../services/util';
import { imgRouter, jpushRouter } from '../../services/common';

@Component({
    selector: 'emoji-component',
    templateUrl: './emoji.component.html',
    styleUrls: ['./emoji.component.scss']
})

export class EmojiComponent implements OnInit {
    @Input()
        private emojiInfo;
    @Output()
        private jpushEmojiSelect: EventEmitter<any> = new EventEmitter();
    private imgRouter = imgRouter;
    private jpushRouter = jpushRouter;
    private tab = 0;
    constructor(
        private elementRef: ElementRef
    ) {

    }
    public ngOnInit() {
        // pass
    }
    @HostListener('window:click') private onClick() {
        if (this.emojiInfo.show === true) {
            this.emojiInfo.show = false;
        }
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
    private emojiSelectAction(idName) {
        let contentId = document.getElementById(this.emojiInfo.contentId);
        let insertHtml = this.elementRef.nativeElement.querySelector('#' + idName).innerHTML;
        insertHtml = insertHtml.replace('width="22', 'width="18');
        Util.insertAtCursor(contentId, insertHtml, false);
        this.emojiInfo.show = false;
    }
    private changeTab(event, index) {
        this.tab = index;
    }
    private jpushEmojiSelectAction(jpushEmoji) {
        this.emojiInfo.show = false;
        this.jpushEmojiSelect.emit(jpushEmoji);
    }
}

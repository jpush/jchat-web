import { Component, OnInit, Input, Output, EventEmitter,
    HostListener, ElementRef } from '@angular/core';

import { Util } from '../../services/util';
import { imgRouter } from '../../services/common';

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
    private util = new Util();
    private imgRouter = imgRouter;
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
    private stopPagation(event) {
        event.stopPropagation();
    }
    private emojiSelectAction(idName) {
        let contentId = document.getElementById(this.emojiInfo.contentId);
        let insertHtml = this.elementRef.nativeElement.querySelector('#' + idName).innerHTML;
        this.util.insertAtCursor(contentId, insertHtml, false);
        this.emojiInfo.show = false;
    }
    private changeTab(event, index) {
        this.tab = index;
    }
}

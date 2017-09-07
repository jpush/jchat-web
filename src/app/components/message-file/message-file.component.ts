import { Component, OnInit, Input, Output, EventEmitter,
    HostListener, ViewChild } from '@angular/core';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import * as download from 'downloadjs';

@Component({
    selector: 'message-file-component',
    templateUrl: './message-file.component.html',
    styleUrls: ['./message-file.component.scss']
})

export class MessageFileComponent implements OnInit {
    @ViewChild(PerfectScrollbarComponent) private componentScroll;
    @Input()
        private msgFile;
    @Output()
        private changeMsgFile: EventEmitter<any> = new EventEmitter();
    @Output()
        private msgFileImageViewer: EventEmitter<any> = new EventEmitter();
    @Output()
        private fileImageLoad: EventEmitter<any> = new EventEmitter();
    private msgType = 'image';
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    @HostListener('window:click') private onWindowClick() {
        this.msgFile.show = false;
        this.msgType = 'image';
    }
    private closeMsgFile() {
        this.msgType = 'image';
        this.msgFile.show = false;
    }
    private changeMsgFileAction(type) {
        this.msgType = type;
        this.changeMsgFile.emit(type);
    }
    private avatarLoad(event, message) {
        if (event.target.naturalHeight > event.target.naturalWidth) {
            event.target.style.width = '100%';
            event.target.style.height = 'auto';
        } else {
            event.target.style.height = '100%';
            event.target.style.width = 'auto';
        }
        if (message.content.msg_type === 'file') {
            message.content.msg_body.width = event.target.naturalWidth;
            message.content.msg_body.height = event.target.naturalHeight;
            this.fileImageLoad.emit(message);
        }
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
    private fileDownload(url, event) {
        event.stopPropagation();
        // 为了兼容火狐下a链接下载，引入downloadjs
        download(url);
    }
    private scrollY(type) {
        const titleHeight = 28;
        const imgHeight = 55;
        const containerPadding = 12 * 2;
        const otherHeight = 74;
        const top = this.componentScroll.directiveRef.geometry().y;
        let msgTop = 0;
        let preTop = 0;
        for (let file of this.msgFile[this.msgType]) {
            msgTop += titleHeight;
            if (this.msgType === 'image') {
                const imgCol = Math.ceil(file.msgs.length / 4);
                msgTop += imgCol * imgHeight + containerPadding;
            } else {
                msgTop += file.msgs.length * otherHeight;
            }
            if (top > preTop && top < msgTop) {
                file.position = 'absolute';
            } else {
                file.position = 'relative';
            }
            preTop = msgTop;
        }
    }
    private imgViewer(message) {
        this.msgFileImageViewer.emit(message);
    }
}

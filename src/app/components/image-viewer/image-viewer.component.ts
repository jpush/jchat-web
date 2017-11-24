import { Component, OnInit, Input, Output, EventEmitter,
    HostListener, ElementRef } from '@angular/core';
import { Store, Action } from '@ngrx/store';
import { chatAction } from '../../pages/chat/actions';
import * as download from 'downloadjs';
import { Util } from '../../services/util';

@Component({
    selector: 'image-viewer-component',
    templateUrl: './image-viewer.component.html',
    styleUrls: ['./image-viewer.component.scss']
})

export class ImageViewerComponent implements OnInit {
    @Input()
        private imageViewer;
    private imageStream$;
    private ratio = 1;
    private ratioTip = '';
    private moveFlag = false;
    private position = {
        left: 0,
        top: 0,
        width: 0,
        height: 0
    };
    private initPosition = {
        width: 0,
        height: 0
    };
    private offset = {
        x: 0,
        y: 0
    };
    private imgHidden = false;
    private index;
    constructor(
        private elementRef: ElementRef,
        private store$: Store<any>
    ) {

    }
    public ngOnInit() {
        if (!this.imageViewer) {
            this.imageViewer = {
                result: [],
                active: {
                    src: '',
                    width: 0,
                    height: 0
                },
                show: false
            };
        }
        this.initImgviewer();
        this.imageStream$ = this.store$.select((state) => {
            const chatState = state['chatReducer'];
            this.stateChanged(chatState);
            return state;
        }).subscribe((state) => {
            // pass
        });
    }
    private stateChanged(chatState) {
        switch (chatState.actionType) {
            case chatAction.loadViewerImageSuccess:
                this.addImageUrl(chatState.viewerImageUrl);
                break;
            default:
        }
    }
    private addImageUrl(viewerImageUrl) {
        for (let img of this.imageViewer.result) {
            if (img.index === viewerImageUrl.index && img.src === viewerImageUrl.src) {
                img.src = viewerImageUrl.src;
                this.imageViewer.active = Util.deepCopyObj(this.imageViewer.result[this.index]);
                this.imageViewer.active.index = this.index;
                break;
            }
        }
    }
    private initImgviewer() {
        const viewerWrap = this.elementRef.nativeElement.querySelector('#viewerWrap');
        const activeWidth = this.imageViewer.active.width;
        const activeHeight = this.imageViewer.active.height;
        const offsetWidth = viewerWrap.offsetWidth;
        const offsetHeight = viewerWrap.offsetHeight;
        if (activeWidth / offsetWidth > activeHeight / offsetHeight &&
            activeWidth > offsetWidth * 0.6) {
            this.position.width = this.initPosition.width = offsetWidth * 0.6;
            this.position.height = this.initPosition.height =
                offsetWidth / activeWidth * 0.6 * activeHeight;
        } else if (activeWidth / offsetWidth < activeHeight / offsetHeight &&
            activeHeight > offsetHeight * 0.6) {
            this.position.height = this.initPosition.height = offsetHeight * 0.6;
            this.position.width = this.initPosition.width =
                offsetHeight / activeHeight * 0.6 * activeWidth;
        } else {
            this.position.height = this.initPosition.height = activeHeight;
            this.position.width = this.initPosition.width = activeWidth;
        }
        this.position.left = (offsetWidth - this.position.width) / 2;
        this.position.top = (offsetHeight - this.position.height) / 2;
    }
    @HostListener('window:resize', ['$event']) private onResize(event) {
        this.initImgviewer();
    }
    @HostListener('window:mousemove', ['$event']) private onMousemove(event) {
        if (this.moveFlag) {
            this.position.left = event.clientX - this.offset.x;
            this.position.top = event.clientY - this.offset.y + 60;
        }
    }
    private wheelScroll(event) {
        let delta;
        if (event.deltaY) {
            delta = event.deltaY > 0 ? 1 : -1;
        } else if (event.wheelDelta) {
            delta = - event.wheelDelta / 120;
        } else if (event.detail) {
            delta = event.detail > 0 ? 1 : -1;
        }
        this.zoomTo(this.ratio + 0.2 * - delta);
    }
    private imgMousedown(event) {
        this.moveFlag = true;
        this.offset = {
            x: event.offsetX,
            y: event.offsetY
        };
    }
    private imgMouseup() {
        this.moveFlag = false;
    }
    private zoomTo(ratio: number) {
        if (ratio > 10) {
            this.showTip('已经是最大了');
        } else if (ratio < 0.2) {
            this.showTip('无法再缩小了');
        } else {
            this.ratio = ratio = Number(ratio.toFixed(1));
            this.position.left = this.position.left +
                (this.position.width - this.initPosition.width * ratio) / 2;
            this.position.top = this.position.top +
            (this.position.height - this.initPosition.height * ratio) / 2;
            this.position.width = this.initPosition.width * ratio;
            this.position.height = this.initPosition.height * ratio;
        }
    }
    private showTip(text: string) {
        this.ratioTip = text;
        setTimeout(() => {
            this.ratioTip = '';
        }, 1000);
    }
    private zoomIn() {
        this.zoomTo(this.ratio + 0.2);
    }
    private zoomOut() {
        this.zoomTo(this.ratio - 0.2);
    }
    private prev() {
        const activeIndex = this.imageViewer.active.index;
        const index = activeIndex > 0 ? activeIndex - 1 : activeIndex;
        this.index = index;
        if (index !== activeIndex) {
            // 如果该图片的url尚未加载，则去请求url
            if (!this.imageViewer.result[index].src) {
                this.imgHidden = true;
                this.store$.dispatch({
                    type: chatAction.loadViewerImage,
                    payload: this.imageViewer.result[index]
                });
            } else {
                // 为了解决相邻两张相同的base64图片不触发onload事件
                if (this.imageViewer.active.src === this.imageViewer.result[index].src) {
                    this.imgHidden = false;
                } else {
                    this.imgHidden = true;
                }
                this.imageViewer.active = Object.assign({}, this.imageViewer.result[index], {});
                this.imageViewer.active.index = index;
            }
        } else {
            this.showTip('已经是第一张了');
        }
    }
    private next() {
        const activeIndex = this.imageViewer.active.index;
        const index = activeIndex < this.imageViewer.result.length - 1 ?
                    activeIndex + 1 : activeIndex;
        if (index !== activeIndex) {
            // 为了解决相邻两张相同的base64图片不触发onload事件
            if (this.imageViewer.active.src === this.imageViewer.result[index].src) {
                this.imgHidden = false;
            } else {
                this.imgHidden = true;
            }
            this.imageViewer.active = Object.assign({}, this.imageViewer.result[index], {});
            this.imageViewer.active.index = index;
        } else {
            this.showTip('已经是最后一张了');
        }
    }
    private closeViewerAction(event) {
        this.imageViewer.show = false;
        event.stopPropagation();
    }
    private imgLoad() {
        this.imgHidden = false;
        this.ratio = 1;
        this.initImgviewer();
    }
    private download(url) {
        // 为了兼容火狐下a链接下载，引入downloadjs
        download(url);
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
}

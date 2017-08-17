import { Component, OnInit, Input, Output, EventEmitter,
        AfterViewInit, ChangeDetectorRef, ElementRef, OnDestroy } from '@angular/core';

@Component({
    selector: 'video-component',
    templateUrl: './video.component.html',
    styleUrls: ['./video.component.scss']
})

export class VideoComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input()
        private url;
    @Output()
        private closeVideo: EventEmitter<any> = new EventEmitter();
    private state = 'play';
    private video;
    private timer = null;
    private currentTime = 0;
    constructor(
        private cdr: ChangeDetectorRef,
        private elementRef: ElementRef
    ) {

    }
    public ngOnInit() {
        // pass
    }
    public ngAfterViewInit() {
        this.video = this.elementRef.nativeElement.querySelector('#videoTag');
        this.cdr.detectChanges();
    }
    public ngOnDestroy() {
        clearInterval(this.timer);
    }
    private closeModal() {
        this.closeVideo.emit();
    }
    private play() {
        this.video.play();
        this.state = 'play';
        this.timer = setInterval(() => {
            this.currentTime = this.video.currentTime;
        }, 100);
    }
    private pause() {
        this.video.pause();
        this.state = 'pause';
        clearInterval(this.timer);
    }
    private videoEnd() {
        this.state = 'pause';
        clearInterval(this.timer);
    }
    private changeCurrentTime(event) {
        this.currentTime = this.video.currentTime = event.offsetX / 438 * this.video.duration;
    }
    private videoCanplay() {
        this.timer = setInterval(() => {
            this.currentTime = this.video.currentTime;
        }, 100);
    }
}

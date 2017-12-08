import {
    Component, OnInit, Input, Output, EventEmitter, ViewChild,
    AfterViewInit, ChangeDetectorRef, OnDestroy
} from '@angular/core';

@Component({
    selector: 'video-component',
    templateUrl: './video.component.html',
    styleUrls: ['./video.component.scss']
})

export class VideoComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('videoTag') private videoTag;
    @Input()
    private url;
    @Output()
    private closeVideo: EventEmitter<any> = new EventEmitter();
    private state = 'play';
    private timer = null;
    private currentTime = 0;
    constructor(
        private cdr: ChangeDetectorRef
    ) { }
    public ngOnInit() {
        // pass
    }
    public ngAfterViewInit() {
        this.cdr.detectChanges();
    }
    public ngOnDestroy() {
        clearInterval(this.timer);
    }
    private closeModal() {
        this.closeVideo.emit();
    }
    private play() {
        this.videoTag.nativeElement.play();
        this.state = 'play';
        this.timer = setInterval(() => {
            this.currentTime = this.videoTag.nativeElement.currentTime;
        }, 100);
    }
    private pause() {
        this.videoTag.nativeElement.pause();
        this.state = 'pause';
        clearInterval(this.timer);
    }
    private videoEnd() {
        this.state = 'pause';
        clearInterval(this.timer);
    }
    private changeCurrentTime(event) {
        this.currentTime = this.videoTag.nativeElement.currentTime =
            event.offsetX / 438 * this.videoTag.nativeElement.duration;
    }
    private videoCanplay() {
        this.timer = setInterval(() => {
            this.currentTime = this.videoTag.nativeElement.currentTime;
        }, 100);
    }
}

import { Directive, ElementRef, Input, OnInit,
    HostListener, EventEmitter, Output } from '@angular/core';
import { Subject } from 'rxjs/Subject';

/**
 * 避免多次重复触发click事件
 */
@Directive({ selector: '[debounceClickDirective]' })

export class DebounceClickDirective implements OnInit {
    @Input()
        private debounceClickDirective;
    @Output()
        private debounceClick: EventEmitter<any> = new EventEmitter();
    private clicks = new Subject<any>();
    constructor() {
        // pass
    }
    public ngOnInit() {
        this.clicks
            .debounceTime(this.debounceClickDirective)
            .subscribe((event) => this.debounceClick.emit(event));
    }
    @HostListener('click', ['$event']) private clickEvent(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.clicks.next(event);
    }
}

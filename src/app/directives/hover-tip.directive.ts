import { Directive, ElementRef, Input, OnInit, HostListener, OnChanges } from '@angular/core';

/**
 * hover提示
 */
@Directive({ selector: '[hoverEvent]' })

export class HoverEventDirective implements OnInit {
    @Input()
        private hoverEvent;
    constructor(private el: ElementRef) {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    @HostListener('mouseenter') private onMouseenter() {
        this.hoverEvent.show = true;
    }
    @HostListener('mouseleave') private onMouseleave() {
        this.hoverEvent.show = false;
    }
}

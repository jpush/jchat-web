import { Directive, ElementRef, Input, OnInit, HostListener, OnChanges } from '@angular/core';
/**
 * 实现非表单元素的数据双向绑定
 */

@Directive({ selector: '[myModel]' })

export class MyModelDirective implements OnInit, OnChanges {
    @Input()
    private myModel;
    constructor(private el: ElementRef) {
        //    pass
    }
    public ngOnChanges() {
        this.el.nativeElement.innerHTML =
            (this.myModel && this.myModel.draft) ? this.myModel.draft : '';
    }
    public ngOnInit() {
        this.el.nativeElement.innerHTML =
            (this.myModel && this.myModel.draft) ? this.myModel.draft : '';
    }
    @HostListener('blur') private onBlur() {
        if (this.myModel && this.myModel.draft) {
            this.myModel.draft = this.el.nativeElement.innerHTML;
        }
    }
    @HostListener('keyup') private onKeyup() {
        if (this.myModel && this.myModel.draft) {
            this.myModel.draft = this.el.nativeElement.innerHTML;
        }
    }
}

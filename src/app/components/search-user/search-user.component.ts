import { Component, OnInit, Input, Output, EventEmitter, trigger, state, style, transition,
        animate, HostListener, ElementRef, OnChanges, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';

@Component({
    selector: 'search-user-component',
    templateUrl: './search-user.component.html',
    styleUrls: ['./search-user.component.scss'],
    animations: [
        trigger('flyIn', [
            state('in', style({transform: 'translateX(-260px)'})),
            state('out', style({transform: 'translateX(0)'})),
            transition('out => in', animate(200)),
            transition('in => out', animate(200))
        ])
    ]
})

export class SearchUserComponent implements OnInit, OnChanges {
    @ViewChild(PerfectScrollbarComponent) private componentScroll;
    private searchKeyword;
    private searchInputIsShow = true;
    private inputAnimate = 'out';
    private singleShowText = '显示全部';
    private groupShowText = '显示全部';
    private singleHeight = '200px';
    private groupHeight = '200px';
    private fileDom;
    @Input()
        private searchUserResult;
    @Output()
        private searchUser: EventEmitter<any> = new EventEmitter();
    @Output()
        private selectUserResult: EventEmitter<any> = new EventEmitter();
    @Output()
        private selectUserRoomResult: EventEmitter<any> = new EventEmitter();
    constructor(
        private elementRef: ElementRef
    ) {}
    public ngOnInit() {
        this.fileDom = this.elementRef.nativeElement.querySelector('#searchInput');
        Observable.fromEvent(this.fileDom, 'keyup')
            .debounceTime(300)
            .subscribe((event: any) => {
                this.searchUser.emit(event.target.value);
                this.singleShowText = '显示全部';
                this.singleHeight = '200px';
            });
    }
    public ngOnChanges() {
        if (!this.searchUserResult.isSearch) {
            this.searchKeyword = '';
        }
    }
    @HostListener('window:click') private onClickWindow() {
        this.searchKeyword = '';
        this.searchUser.emit(this.searchKeyword);
        this.inputAnimate = 'out';
        this.searchInputIsShow = true;
    }
    private singleShowAll() {
        this.showAll('single');
    }
    private groupShowAll() {
        this.showAll('group');
    }
    private showAll(type: string) {
        if (this[`${type}ShowText`] === '显示全部') {
            this[`${type}ShowText`] = '收起';
            this[`${type}Height`] = 'none';
        } else {
            this[`${type}ShowText`] = '显示全部';
            this[`${type}Height`] = '200px';
        }
        setTimeout(() => {
            this.componentScroll.directiveRef.update();
        });
    }
    private clearInput() {
        this.searchKeyword = '';
        this.searchUser.emit(this.searchKeyword);
        this.fileDom.focus();
    }
    private selectSearchItem(item) {
        this.selectUserResult.emit(item);
    }
    private selectSearchRoom(item) {
        this.selectUserRoomResult.emit(item);
    }
    private showSearchInput() {
        this.searchInputIsShow = false;
        this.inputAnimate = 'in';
        this.groupShowText = '显示全部';
        this.groupHeight = '200px';
        this.singleShowText = '显示全部';
        this.singleHeight = '200px';
        setTimeout(() => {
            this.fileDom.focus();
        }, 200);
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
}

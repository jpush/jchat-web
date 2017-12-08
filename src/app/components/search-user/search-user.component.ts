import {
    Component, OnInit, Input, Output, EventEmitter,
    HostListener, OnChanges, ViewChild, AfterViewInit, OnDestroy
} from '@angular/core';
import { Observable } from 'rxjs';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';

@Component({
    selector: 'search-user-component',
    templateUrl: './search-user.component.html',
    styleUrls: ['./search-user.component.scss']
})

export class SearchUserComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    @ViewChild(PerfectScrollbarComponent) private componentScroll;
    @ViewChild('searchInput') private searchInput;
    private searchKeyword;
    private searchInputIsShow = true;
    private inputAnimate = 'out';
    private singleShowText = '显示全部';
    private groupShowText = '显示全部';
    private singleHeight = '200px';
    private groupHeight = '200px';
    private inputStream$;
    @Input()
    private searchUserResult;
    @Output()
    private searchUser: EventEmitter<any> = new EventEmitter();
    @Output()
    private selectUserResult: EventEmitter<any> = new EventEmitter();
    @Output()
    private selectUserRoomResult: EventEmitter<any> = new EventEmitter();
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    public ngOnChanges() {
        if (!this.searchUserResult.isSearch) {
            this.searchKeyword = '';
        }
    }
    public ngAfterViewInit() {
        this.inputStream$ = Observable.fromEvent(this.searchInput.nativeElement, 'keyup')
            .debounceTime(300)
            .subscribe((event: any) => {
                this.searchUser.emit(event.target.value);
                this.singleShowText = '显示全部';
                this.singleHeight = '200px';
            });
    }
    public ngOnDestroy() {
        this.inputStream$.unsubscribe();
    }
    @HostListener('window:click') private onClickWindow() {
        this.searchKeyword = '';
        this.searchUser.emit(this.searchKeyword);
        this.inputAnimate = 'out';
        this.searchInputIsShow = true;
        this.searchUserResult.isSearch = false;
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
        this.searchInput.nativeElement.focus();
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
            this.searchInput.nativeElement.focus();
        }, 200);
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
}

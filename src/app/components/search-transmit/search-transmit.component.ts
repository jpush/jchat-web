import {
    Component, OnInit, Input, Output, EventEmitter,
    OnChanges, ViewChild, HostListener, AfterViewInit, OnDestroy
} from '@angular/core';
import { Observable } from 'rxjs';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';

@Component({
    selector: 'search-transmit-component',
    templateUrl: './search-transmit.component.html',
    styleUrls: ['./search-transmit.component.scss']
})

export class SearchTransmitComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    @ViewChild(PerfectScrollbarComponent) private componentScroll;
    @ViewChild('searchInput') private searchInput;
    private searchKeyword;
    private searchInputIsShow = true;
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
    private changeInput: EventEmitter<any> = new EventEmitter();
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
            .subscribe((event: any) => this.searchUser.emit(event.target.value));
    }
    public ngOnDestroy() {
        this.inputStream$.unsubscribe();
    }
    @HostListener('window:click') private onWindowClick() {
        this.searchUserResult.isSearch = false;
        this.searchKeyword = '';
        this.groupShowText = '显示全部';
        this.groupHeight = '200px';
        this.singleShowText = '显示全部';
        this.singleHeight = '200px';
    }
    private stopPropagation(event) {
        event.stopPropagation();
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
        this.groupShowText = '显示全部';
        this.groupHeight = '200px';
        this.singleShowText = '显示全部';
        this.singleHeight = '200px';
        this.searchUser.emit(this.searchKeyword);
        this.searchInput.nativeElement.focus();
    }
    private changeChecked(item) {
        this.changeInput.emit(item);
    }
}

import { Component, OnInit, Input, Output, EventEmitter,
        ElementRef, OnChanges, ViewChild, HostListener } from '@angular/core';
import { Observable } from 'rxjs';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
const avatarErrorIcon = '../../../assets/images/single-avatar.svg';

@Component({
    selector: 'search-transmit-component',
    templateUrl: './search-transmit.component.html',
    styleUrls: ['./search-transmit.component.scss']
})

export class SearchTransmitComponent implements OnInit, OnChanges {
    @ViewChild(PerfectScrollbarComponent) private componentScroll;
    private searchKeyword;
    private searchInputIsShow = true;
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
        private changeInput: EventEmitter<any> = new EventEmitter();
    @Output()
        private searchBtn: EventEmitter<any> = new EventEmitter();
    constructor(
        private elementRef: ElementRef
    ) {

    }
    public ngOnInit() {
        this.fileDom = this.elementRef.nativeElement.querySelector('#searchInput');
        Observable.fromEvent(this.fileDom, 'keyup')
            .debounceTime(300)
            .subscribe((event: any) => {
                if (event.keyCode !== 13) {
                    this.searchUser.emit(event.target.value);
                }
            });
    }
    public ngOnChanges() {
        if (!this.searchUserResult.isSearch) {
            this.searchKeyword = '';
        }
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
        if (this.singleShowText === '显示全部') {
            this.singleShowText = '收起';
            this.singleHeight = 'none';
            this.componentScroll.directiveRef.update();
        } else {
            this.singleShowText = '显示全部';
            this.singleHeight = '200px';
            this.componentScroll.directiveRef.update();
        }
    }
    private groupShowAll() {
        if (this.groupShowText === '显示全部') {
            this.groupShowText = '收起';
            this.groupHeight = 'none';
            this.componentScroll.directiveRef.update();
        } else {
            this.groupShowText = '显示全部';
            this.groupHeight = '200px';
            this.componentScroll.directiveRef.update();
        }
    }
    private avatarErrorIcon(event) {
        event.target.src = avatarErrorIcon;
    }
    private clearInput() {
        this.searchKeyword = '';
        this.groupShowText = '显示全部';
        this.groupHeight = '200px';
        this.singleShowText = '显示全部';
        this.singleHeight = '200px';
        this.searchUser.emit(this.searchKeyword);
        this.fileDom.focus();
    }
    private avatarLoad(event) {
        if (event.target.naturalHeight > event.target.naturalWidth) {
            event.target.style.width = '100%';
            event.target.style.height = 'auto';
        } else {
            event.target.style.height = '100%';
            event.target.style.width = 'auto';
        }
    }
    private changeChecked(item) {
        this.changeInput.emit(item);
    }
    private searchBtnAction() {
        if (this.searchKeyword.length > 0) {
            this.searchBtn.emit(this.searchKeyword);
        }
    }
}

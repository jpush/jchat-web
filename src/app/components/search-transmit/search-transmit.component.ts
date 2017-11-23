import { Component, OnInit, Input, Output, EventEmitter,
        ElementRef, OnChanges, ViewChild, HostListener } from '@angular/core';
import { Observable } from 'rxjs';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import { Util } from '../../services/util';
const avatarErrorIcon = '../../../assets/images/single-avatar.svg';
const groupAvatarErrorIcon = '../../../assets/images/group-avatar.svg';

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
    constructor(
        private elementRef: ElementRef
    ) {}
    public ngOnInit() {
        this.fileDom = this.elementRef.nativeElement.querySelector('#searchInput');
        Observable.fromEvent(this.fileDom, 'keyup')
            .subscribe((event: any) => {
                this.searchUser.emit(event.target.value);
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
    private avatarErrorIcon(event) {
        event.target.src = avatarErrorIcon;
    }
    private groupAvatarErrorIcon(event) {
        event.target.src = groupAvatarErrorIcon;
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
        Util.reduceAvatarSize(event);
    }
    private changeChecked(item) {
        this.changeInput.emit(item);
    }
}

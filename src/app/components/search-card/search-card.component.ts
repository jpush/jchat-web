import { Component, OnInit, Input, Output, EventEmitter,
    AfterViewInit, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { Util } from '../../services/util';
const avatarErrorIcon = '../../../assets/images/single-avatar.svg';

@Component({
    selector: 'search-card-component',
    templateUrl: './search-card.component.html',
    styleUrls: ['./search-card.component.scss']
})

export class SearchCardComponent implements OnInit, AfterViewInit {
    @Input()
        private searchResult;
    @Output()
        private searchItem: EventEmitter<any> = new EventEmitter();
    @Output()
        private searchBtn: EventEmitter<any> = new EventEmitter();
    @Output()
        private clearInput: EventEmitter<any> = new EventEmitter();
    @Output()
        private searchKeyup: EventEmitter<any> = new EventEmitter();
    @Output()
        private changeChecked: EventEmitter<any> = new EventEmitter();
    private fileDom;
    constructor(
        private elementRef: ElementRef
    ) {}
    public ngOnInit() {
        // pass
    }
    public ngAfterViewInit() {
        this.fileDom = this.elementRef.nativeElement.querySelector('#searchCard');
        Observable.fromEvent(this.fileDom, 'keyup')
            .subscribe((event: any) => {
                this.searchKeyup.emit(event.target.value);
            });
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
    private avatarErrorIcon(event) {
        event.target.src = avatarErrorIcon;
    }
    private searchItemAction(item) {
        this.searchItem.emit(item);
    }
    private clearInputAction() {
        this.fileDom.focus();
        this.searchResult.keywords = '';
        this.clearInput.emit();
    }
    private changeCheckedAction(item) {
        this.changeChecked.emit(item);
    }
    private avatarLoad(event) {
        Util.reduceAvatarSize(event);
    }
}

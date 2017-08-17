import { Component, OnInit, Input, Output, EventEmitter,
    AfterViewInit, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
const avatarErrorIcon = '../../../assets/images/single-avatar.svg';

@Component({
    selector: 'search-member-component',
    templateUrl: './search-member.component.html',
    styleUrls: ['./search-member.component.scss']
})

export class SearchMemberComponent implements OnInit, AfterViewInit {
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
    ) {

     }
    public ngOnInit() {
        // pass
    }
    public ngAfterViewInit() {
        this.fileDom = this.elementRef.nativeElement.querySelector('#' + this.searchResult.id);
        Observable.fromEvent(this.fileDom, 'keyup')
            .debounceTime(200)
            .subscribe((event: any) => {
                if (event.keyCode !== 13) {
                    this.searchKeyup.emit(event.target.value);
                }
            });
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
    private avatarErrorIcon(event) {
        event.target.src = avatarErrorIcon;
    }
    private searchItemAction(item) {
        if (!this.searchResult.checkbox) {
            this.searchResult.keywords = '';
        }
        this.searchItem.emit(item);
    }
    private clearInputAction() {
        this.fileDom.focus();
        this.searchResult.keywords = '';
        this.clearInput.emit();
    }
    private searchBtnAction() {
        if (this.searchResult.keywords.length > 0 && this.searchResult.checkbox) {
            this.searchBtn.emit(this.searchResult.keywords);
        }
    }
    private changeCheckedAction(item) {
        this.changeChecked.emit(item);
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
}

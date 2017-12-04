import { Component, OnInit, Input, Output, EventEmitter,
    AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
    selector: 'search-member-component',
    templateUrl: './search-member.component.html',
    styleUrls: ['./search-member.component.scss']
})

export class SearchMemberComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('searchInput') private searchInput;
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
    private inputStream$;
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    public ngAfterViewInit() {
        this.inputStream$ = Observable.fromEvent(this.searchInput.nativeElement, 'keyup')
            .subscribe((event: any) => {
                if (event.keyCode !== 13) {
                    this.searchKeyup.emit(event.target.value);
                }
            });
    }
    public ngOnDestroy() {
        this.inputStream$.unsubscribe();
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
    private searchItemAction(item) {
        if (!this.searchResult.checkbox) {
            this.searchResult.keywords = '';
        }
        this.searchItem.emit(item);
    }
    private clearInputAction() {
        this.searchInput.nativeElement.focus();
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
    private clearKeyWords() {
        this.searchInput.nativeElement.value = '';
    }
}

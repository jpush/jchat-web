import {
    Component, OnInit, Input, Output, EventEmitter,
    AfterViewInit, ViewChild, OnDestroy
} from '@angular/core';
import { Observable } from 'rxjs';

@Component({
    selector: 'search-card-component',
    templateUrl: './search-card.component.html',
    styleUrls: ['./search-card.component.scss']
})

export class SearchCardComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('searchCard') private searchCard;
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
        this.inputStream$ = Observable.fromEvent(this.searchCard.nativeElement, 'keyup')
            .subscribe((event: any) => this.searchKeyup.emit(event.target.value));
    }
    public ngOnDestroy() {
        this.inputStream$.unsubscribe();
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
    private searchItemAction(item) {
        this.searchItem.emit(item);
    }
    private clearInputAction() {
        this.searchCard.nativeElement.focus();
        this.searchResult.keywords = '';
        this.clearInput.emit();
    }
    private changeCheckedAction(item) {
        this.changeChecked.emit(item);
    }
}

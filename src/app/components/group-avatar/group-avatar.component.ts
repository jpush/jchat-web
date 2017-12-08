import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import '../../../assets/static/js/cropper.min.css';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/debounceTime';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { chatAction } from '../../pages/chat/actions';
const Cropper = require('../../../assets/static/js/cropper.min.js');

@Component({
    selector: 'group-avatar-component',
    templateUrl: './group-avatar.component.html',
    styleUrls: ['./group-avatar.component.scss']
})

export class GroupAvatarComponent implements OnInit {
    @ViewChild('cropperImg') private cropperImg;
    @Input()
    private groupAvatarInfo;
    @Output()
    private groupAvatar: EventEmitter<any> = new EventEmitter();
    private cropper;
    constructor(
        private store$: Store<any>
    ) { }
    public ngOnInit() {
        // pass
    }
    private cropperImgLoad() {
        this.cropper = new Cropper(this.cropperImg.nativeElement, {
            aspectRatio: 1 / 1,
            zoomable: false,
            rotatable: false,
            viewMode: 1,
            minCropBoxWidth: 25
        });
    }
    private modalAction(event, type?) {
        event.stopPropagation();
        if (type === 'confirm') {
            const that = this;
            let canvas = this.cropper.getCroppedCanvas();
            if (canvas.toBlob) {
                canvas.toBlob((blob) => {
                    let formData = new FormData();
                    formData.append(that.groupAvatarInfo.filename, blob,
                        that.groupAvatarInfo.filename);
                    that.groupAvatarInfo.formData = formData;
                    that.groupAvatarInfo.src = canvas.toDataURL('image/png', 1.0);
                    that.groupAvatar.emit(that.groupAvatarInfo);
                    that.groupAvatarInfo.show = false;
                }, '');
            }
        } else {
            this.groupAvatarInfo.show = false;
        }
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
}

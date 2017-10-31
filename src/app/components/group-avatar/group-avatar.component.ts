import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
let Cropper =  require('../../../assets/static/js/cropper.min.js');
import '../../../assets/static/js/cropper.min.css';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/debounceTime';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Actions, Effect, toPayload } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { chatAction } from '../../pages/chat/actions';
import '../../../assets/static//js/canvas-to-blob.js';

@Component({
    selector: 'group-avatar-component',
    templateUrl: './group-avatar.component.html',
    styleUrls: ['./group-avatar.component.scss']
})

export class GroupAvatarComponent implements OnInit {
    @Input()
        private groupAvatarInfo;
    @Output()
        private groupAvatar: EventEmitter<any> = new EventEmitter();
    private cropper;
    private width;
    private height;
    private minWidth;
    private minHeight;
    private maxWidth;
    private maxHeight;
    constructor(private store$: Store<any>) {
        // pass
     }
    public ngOnInit() {
        // pass
    }
    private cropperImgLoad() {
        let image = document.getElementById('cropper');
        this.cropper = new Cropper(image, {
            aspectRatio: 1 / 1,
            zoomable: false,
            rotatable: false,
            viewMode: 1,
            minCropBoxWidth: 25,
            crop (event) {
                this.width = event.detail.width;
                this.height = event.detail.height;
                this.minWidth = event.detail.minWidth;
                this.minHeight = event.detail.minHeight;
                this.maxWidth = event.detail.maxWidth;
                this.maxHeight = event.detail.maxHeight;
            }
        });
    }
    private modalAction(event, type ?) {
        event.stopPropagation();
        if (type === 'confirm') {
            let that = this;
            let canvas = this.cropper.getCroppedCanvas({
                width: that.width,
                height: that.height,
                minWidth: that.minWidth,
                minHeight: that.minHeight,
                maxWidth: that.maxWidth,
                maxHeight: that.maxHeight,
                fillColor: '#fff',
                imageSmoothingEnabled: false,
                imageSmoothingQuality: 'high'
            });
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

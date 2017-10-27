import { Component, OnInit, Input, Output, EventEmitter, AfterContentInit } from '@angular/core';
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

@Component({
    selector: 'group-avatar-component',
    templateUrl: './group-avatar.component.html',
    styleUrls: ['./group-avatar.component.scss']
})

export class GroupAvatarComponent implements OnInit, AfterContentInit {
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
    public ngAfterContentInit() {
        let image = document.getElementById('cropper');
        setTimeout(() => {
            this.cropper = new Cropper(image, {
                aspectRatio: 1 / 1,
                zoomable: false,
                rotatable: false,
                viewMode: 1,
                crop: function (e) {
                    console.log(3333, e);
                    this.width = e.detail.width;
                    this.height = e.detail.height;
                    this.minWidth = e.detail.minWidth;
                    this.minHeight = e.detail.minHeight;
                    this.maxWidth = e.detail.maxWidth;
                    this.maxHeight = e.detail.maxHeight;
                }
            });
        }, 2000)
    }
    private modalAction(event, type ?) {
        event.stopPropagation();
        this.groupAvatarInfo.show = false;
        if (type) {
            this.groupAvatar.emit(this.groupAvatarInfo);
        }
    }
    private stopPropagation(event) {
        event.stopPropagation();
    }
    private cropperAction() {
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
        let blob;
        // 兼容ie
        if (canvas.msToBlob) {
            blob = canvas.msToBlob();
        } else if (canvas.toBlob) {
            blob = canvas.toBlob(() => {
                // pass
            });
        }
        let formData = new FormData();
        formData.append('image', blob);
        let data = {
            actionType: 'modifyGroupAvatar',
            avatar: formData,
            gid: 23303505,
            src: canvas.toDataURL()
        };
        this.store$.dispatch({
            type: chatAction.updateGroupInfo,
            payload: data
        });
    }
}

import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Util } from '../../services/util';
import '../../../assets/static/js/cropper.min.css';
import '../../services/tools/canvas-to-blob.js';
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
    constructor() {
        // pass
    }
    public ngOnInit() {
        // pass
    }
    private cropperImgLoad() {
        this.cropper = new Cropper(this.cropperImg.nativeElement, {
            aspectRatio: 1 / 1,
            zoomable: false,
            rotatable: false,
            viewMode: 1,
            minCropBoxWidth: 30
        });
    }
    private modalAction(event, type?) {
        event.stopPropagation();
        if (type === 'confirm') {
            const that = this;
            const canvas = this.cropper.getCroppedCanvas({
                width: 100,
                height: 100,
                imageSmoothingQuality: 'low'
            });
            if (canvas.toBlob) {
                canvas.toBlob((blob) => {
                    let formData = new FormData();
                    formData.append(that.groupAvatarInfo.filename, blob,
                        that.groupAvatarInfo.filename);
                    const ext = Util.getExt(that.groupAvatarInfo.filename) || 'png';
                    that.groupAvatarInfo.formData = formData;
                    that.groupAvatarInfo.src = canvas.toDataURL(`image/${ext}`, 1);
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

import { Component, OnInit, Input, Output,
    EventEmitter, AfterViewInit, ElementRef,
    HostListener, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { PerfectScrollbarComponent, PerfectScrollbarDirective } from 'ngx-perfect-scrollbar';
import { global, emojiConfig, jpushConfig, imgRouter,
    pageNumber, authPayload, StorageService } from '../../services/common';
import { Util } from '../../services/util';
import { Emoji } from '../../services/tools';
import { chatAction } from '../../pages/chat/actions';
import { roomAction } from '../../pages/room/actions';
import * as download from 'downloadjs';

@Component({
    selector: 'room-panel-component',
    templateUrl: './room-panel.component.html',
    styleUrls: ['./room-panel.component.scss']
})

export class RoomPanelComponent implements OnInit, AfterViewInit, OnChanges {
    @ViewChild(PerfectScrollbarComponent) private componentScroll;
    @Input()
        private enter;
    @Input()
        private messageList;
    @Input()
        private selfInfo;
    @Input()
        private scrollToBottom;
    @Input()
        private otherScrollTobottom;
    @Output()
        private showRoomInfomation: EventEmitter<any> = new EventEmitter();
    @Output()
        private sendFile: EventEmitter<any> = new EventEmitter();
    @Output()
        private sendPic: EventEmitter<any> = new EventEmitter();
    @Output()
        private businessCardSend: EventEmitter<any> = new EventEmitter();
    @Output()
        private sendMsg: EventEmitter<any> = new EventEmitter();
    @Output()
        private msgTransmit: EventEmitter<any> = new EventEmitter();
    @Output()
        private selfInfoEmit: EventEmitter<any> = new EventEmitter();
    @Output()
        private otherInfo: EventEmitter<any> = new EventEmitter();
    @Output()
        private videoPlay: EventEmitter<any> = new EventEmitter();
    private viewer = {};
    private voiceState = [];
    private imageViewer = {
        result: [],
        active: {
            index: -1
        },
        show: false,
    };
    private loadFlag = true;
    private roomInfomationHover = {
        tip: '聊天室资料',
        position: {
            left: -40,
            top: 27
        },
        show: false
    };
    private emojiInfo = {
        show: false,
        position: {
            left: 0,
            top: 0
        },
        emojiAlias: emojiConfig,
        jpushAlias: jpushConfig,
        contentId: 'contentDiv2'
    };
    private inputNoBlur = true;
    private inputToLast = false;
    private flag = false;
    private contentDiv;
    private businessCard = {
        show: false,
        info: []
    };
    private pasteImage: any = {
        show: false,
        info: {
            src: '',
            width: 0,
            height: 0,
            pasteFile: {}
        }
    };
    private dropFileInfo: any = {
        show: false,
        info: {}
    };
    private global = global;
    private moreMenu = {
        show: false,
        top: 0,
        left: 0,
        info: [
            {
                key: 0,
                name: '转发',
                show: true,
                isFirst: true
            },
            {
                key: 1,
                name: '复制',
                show: true,
                isFirst: false
            }
        ],
        item: null
    };
    constructor(
        private elementRef: ElementRef,
        private store$: Store<any>,
        private storageService: StorageService
    ) {}
    public ngOnInit() {
        this.store$.select((state) => {
            const roomState = state['roomReducer'];
            const contactState = state['contactReducer'];
            this.stateChanged(roomState, contactState);
            return state;
        }).subscribe((state) => {
            // pass
        });
    }
    public ngOnChanges(changes: SimpleChanges) {
        if (changes.scrollToBottom) {
            if (this.contentDiv) {
                this.contentDiv.innerHTML = '';
            }
            this.scrollBottom(150, false, () => {
                if (this.contentDiv) {
                    this.contentDiv.focus();
                }
            });
        }
        if (changes.otherScrollTobottom) {
            this.scrollBottom(150, true);
        }
    }
    public ngAfterViewInit() {
        this.contentDiv = this.elementRef.nativeElement.querySelector('#contentDiv2');
    }
    @HostListener('document:drop', ['$event']) private onDrop(event) {
        event.preventDefault();
    }
    @HostListener('document:dragleave', ['$event']) private onDragleave(event) {
        event.preventDefault();
    }
    @HostListener('document:dragenter', ['$event']) private ondDagenter(event) {
        event.preventDefault();
    }
    @HostListener('document:dragover', ['$event']) private onDragover(event) {
        event.preventDefault();
    }
    @HostListener('window:click') private onClickWindow() {
        this.inputToLast = true;
        this.inputNoBlur = true;
    }
    @HostListener('window:keyup', ['$event']) private onKeyupWindow(event) {
        // 回车发送复制的图片或者拖拽的文件
        if (this.pasteImage.show && event.keyCode === 13) {
            this.pasteImageEmit();
            this.pasteImage = {
                show: false,
                info: {
                    src: '',
                    width: 0,
                    height: 0,
                    pasteFile: {}
                }
            };
        } else if (this.dropFileInfo.show && event.keyCode === 13) {
            this.dropFileEmit();
            this.dropFileInfo = {
                show: false,
                info: {}
            };
        }
    }
    private scrollBottom(time: number, isLoad ?: boolean, callback ?: () => void) {
        if (!isLoad) {
            this.loadFlag = false;
        }
        setTimeout(() => {
            this.componentScroll.directiveRef.update();
            this.componentScroll.directiveRef.scrollToBottom();
            if (!isLoad) {
                this.loadFlag = true;
            }
            if (callback) {
                callback();
            }
        }, time);
    }
    private stateChanged(roomState, contactState) {
        switch (roomState.actionType) {
            case chatAction.dispatchFriendList:
                this.businessCard.info = contactState.friendList;
                break;
            case roomAction.receiveMessageSuccess:
                this.pointerToMap(roomState);
            case roomAction.sendTextMsg:

            case roomAction.sendFileMsg:

            case roomAction.sendPicMsg:

            case roomAction.transmitPicMsg:
                this.imageViewer.result = roomState.imageViewer;
                break;
            case roomAction.getRoomVoiceStateSuccess:
                this.voiceState = roomState.voiceRoomState;
                break;
            default:
        }
    }
    // 接收到地图消息渲染地图
    private pointerToMap(roomState) {
        if (roomState.newMessage.content.msg_type === 'location') {
            const length = roomState.messageList.length;
            const newMessage = Util.deepCopyObj(roomState.newMessage);
            const msgBody = newMessage.content.msg_body;
            setTimeout(() => {
                Util.theLocation({
                    id: 'allmap2' + (length - 1).toString(),
                    longitude: msgBody.longitude,
                    latitude: msgBody.latitude,
                    scale: msgBody.scale
                });
            });
        }
    }
    private msgContentClick(event) {
        event.stopPropagation();
        this.inputToLast = false;
    }
    private msgMouseleave() {
        this.moreMenu.show = false;
    }
    private menuItemEnterEmit() {
        this.menuMouse(true);
    }
    private menuItemLeaveEmit() {
        this.menuMouse(false);
    }
    private menuMouse(isShow) {
        for (let item of this.messageList) {
            if (this.moreMenu.item.msg_id === item.msg_id) {
                item.showMoreIcon = isShow;
                break;
            }
        }
    }
    // 显示图片预览
    private imageViewerShow(item) {
        for (let i = 0; i < this.imageViewer.result.length; i++) {
            const msgIdFlag = item.msg_id && this.imageViewer.result[i].msg_id === item.msg_id;
            const msgKeyFlag = item.msgKey && this.imageViewer.result[i].msgKey === item.msgKey;
            if (msgIdFlag || msgKeyFlag) {
                this.imageViewer.active = Util.deepCopyObj(this.imageViewer.result[i]);
                this.imageViewer.active.index = i;
                break;
            }
        }
        this.imageViewer.show = true;
        this.viewer = this.imageViewer;
    }
    // 点击更多列表的元素
    private selectMoreMenuItemEmit(item) {
        if (item.key === 0) {
            this.msgTransmit.emit(this.moreMenu.item);
        }
        this.moreMenu.show = false;
    }
    private showYouMoreText(event, item) {
        const showArr = [true, true];
        const isFirstArr = [true, false];
        this.menuOption(showArr, isFirstArr);
        this.moreOperation(event, item);
    }
    private showYouMoreOther(event, item) {
        const showArr = [true, false];
        const isFirstArr = [true, false];
        this.menuOption(showArr, isFirstArr);
        this.moreOperation(event, item);
    }
    private showMeMoreText(event, item) {
        const showArr = [true, true];
        const isFirstArr = [true, false];
        this.menuOption(showArr, isFirstArr);
        this.moreOperation(event, item);
    }
    private showMeMoreOther(event, item) {
        const showArr = [true, false];
        const isFirstArr = [true, false];
        this.menuOption(showArr, isFirstArr);
        this.moreOperation(event, item);
    }
    // 更多列表的配置
    private menuOption(showArr, isFirstArr) {
        for (let i = 0; i < showArr.length; i++) {
            this.moreMenu.info[i].show = showArr[i];
        }
        for (let i = 0; i < isFirstArr.length; i++) {
            this.moreMenu.info[i].isFirst = isFirstArr[i];
        }
    }
    // 更多列表的位置
    private moreOperation(event, item) {
        this.moreMenu.show = !this.moreMenu.show;
        if (this.moreMenu.show) {
            this.moreMenu.top = event.clientY - event.offsetY + 20;
            this.moreMenu.left = event.clientX - event.offsetX;
            this.moreMenu.item = item;
        }
    }
    private showRoomInfomationAction() {
        this.showRoomInfomation.emit();
    }
    // 显示隐藏emoji面板
    private showEmojiPanel(event) {
        this.inputNoBlur = false;
        event.stopPropagation();
        this.contentDiv.focus();
        if (this.inputToLast) {
            Util.focusLast(this.contentDiv);
        }
        if (this.emojiInfo.show) {
            setTimeout(() => {
                this.inputNoBlur = true;
            }, 200);
        }
        this.emojiInfo.show = !this.emojiInfo.show;
    }
    private showBusinessCardModal() {
        this.businessCard.show = true;
    }
    private businessCardSendEmit(user) {
        this.businessCardSend.emit(user);
    }
    // 粘贴图片发送
    private pasteImageEmit() {
        let img = new FormData();
        img.append(this.pasteImage.info.pasteFile.name, this.pasteImage.info.pasteFile);
        this.sendPic.emit({
            img,
            type: 'paste',
            info: this.pasteImage.info
        });
    }
    // 粘贴文本，将文本多余的样式代码去掉/粘贴图片
    private pasteMessage(event) {
        const clipboardData = event.clipboardData || (<any> window).clipboardData;
        const items = clipboardData.items;
        const files = clipboardData.files;
        let item;
        // 粘贴图片不兼容safari
        const userAgent = navigator.userAgent;
        const isSafari = userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1;
        if (!isSafari) {
            if (files && files.length) {
                this.getImgObj(files[0]);
            } else if (items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].kind === 'file' && items[i].type.match(/^image\//i)) {
                        item = items[i];
                        break;
                    }
                }
            }
            if (item) {
                this.getImgObj(item.getAsFile());
            }
        }
        let pastedData = clipboardData.getData('Text');
        pastedData = pastedData.replace(/</g, '&lt;');
        pastedData = pastedData.replace(/>/g, '&gt;');
        pastedData = pastedData.replace(/\n/g, '<br>');
        pastedData = pastedData.replace(/ /g, '&nbsp;');
        pastedData = Emoji.emoji(pastedData, 18);
        Util.insertAtCursor(this.contentDiv, pastedData, false);
        return false;
    }
    // 拖拽预览文件或者图片
    private dropArea(event) {
        event.preventDefault();
        let fileList = event.dataTransfer.files;
        if (fileList.length === 0) {
            return false;
        }
        // 检测文件是不是图片
        if (fileList[0].type.indexOf('image') === -1) {
            this.dropFileInfo.info = fileList[0];
            this.dropFileInfo.show = true;
        } else {
            this.getImgObj(fileList[0]);
        }
    }
    private dropFileEmit() {
        let file = new FormData();
        file.append(this.dropFileInfo.info.name, this.dropFileInfo.info);
        this.sendFile.emit({
            file,
            fileData: this.dropFileInfo.info
        });
    }
    // 获取拖拽时或者粘贴图片时的图片对象
    private getImgObj(file) {
        const that = this;
        let img = new Image();
        let pasteFile = file;
        let reader = new FileReader();
        reader.readAsDataURL(pasteFile);
        reader.onload = function(e){
            img.src = this.result;
            const _this = this;
            img.onload = function(){
                that.pasteImage.info = {
                    src: _this.result,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    pasteFile
                };
                that.pasteImage.show = true;
            };
        };
    }
    private fileDownload(url) {
        // 为了兼容火狐下a链接下载，引入downloadjs
        download(url);
    }
    // 发送文本
    private sendMsgAction() {
        let draft = this.contentDiv.innerHTML;
        if (draft) {
            draft = draft.replace(/^(<br>){1,}$/g, '');
            draft = draft.replace(/&nbsp;/g, ' ');
            draft = draft.replace(/<br>/g, '\n');
            const imgReg = new RegExp(`<img.+?${imgRouter}.{1,}?\.png".*?>`, 'g');
            if (draft.match(imgReg)) {
                let arr = draft.match(imgReg);
                for (let item of arr) {
                    let str = item.split(`src="${imgRouter}`)[1];
                    let str2 = str.split('.png"')[0];
                    draft = draft.replace(item, Emoji.convert(str2));
                }
            }
            draft = draft.replace(new RegExp('&lt;', 'g'), '<');
            draft = draft.replace(new RegExp('&gt;', 'g'), '>');
            this.sendMsg.emit({
                content: draft
            });
            this.flag = true;
            this.contentDiv.innerHTML = '';
        }
    }
    // 重新发送文本消息和名片消息
    private repeatSendMsgAction(item) {
        item.success = 1;
        this.sendMsg.emit({
            repeatSend: item
        });
    }
    // 发送文件
    private sendFileAction(event) {
        // 为了防止首次选择了文件，第二次选择文件的时候点击取消按钮时触发change事件的报错
        if (!event.target.files[0]) {
            return;
        }
        let file = Util.getFileFormData(event.target);
        this.sendFile.emit({
            file,
            fileData: event.target.files[0]
        });
        this.contentDiv.focus();
        Util.focusLast(this.contentDiv);
        event.target.value = '';
    }
    private repeatSendFileAction(item) {
        item.success = 1;
        this.sendFile.emit({
            repeatSend: item
        });
    }
    // 发送图片
    private sendPicAction(event) {
        // 为了防止首次选择了文件，第二次选择文件的时候点击取消按钮时触发change事件的报错
        if (!event.target.files[0]) {
            return;
        }
        let img = Util.getFileFormData(event.target);
        this.sendPic.emit({
            img,
            type: 'img'
        });
        this.contentDiv.focus();
        Util.focusLast(this.contentDiv);
        event.target.value = '';
    }
    private repeatSendPicAction(item) {
        item.success = 1;
        this.sendPic.emit({
            repeatSend: item
        });
    }
    private jpushEmojiSelectEmit(jpushEmoji) {
        this.sendPic.emit({
            jpushEmoji,
            type: 'jpushEmoji'
        });
    }
    private imgLoaded(i) {
        i.content.msg_body.loading = true;
    }
    // 查看自己的资料
    private watchSelfInfo() {
        this.selfInfoEmit.emit();
    }
    // 查看对方用户资料
    private watchOtherInfo(content) {
        let username = content.from_id ? content.from_id : content.name;
        let info: any = {
            username
        };
        if (content.hasOwnProperty('avatarUrl')) {
            info.avatarUrl = content.avatarUrl;
        }
        this.otherInfo.emit(info);
    }
    // 点击查看名片
    private watchBusinessCardInfo(extras) {
        let info: any = {
            username: extras.userName
        };
        if (extras.avatarUrl) {
            info.avatarUrl = extras.avatarUrl;
        }
        if (extras.userName === global.user) {
            this.selfInfoEmit.emit();
        } else {
            this.otherInfo.emit(info);
        }
    }
    // 输入框keydown，ctrl + enter换行，enter发送消息
    private preKeydown(event) {
        if (event.keyCode === 13 && event.ctrlKey) {
            let insertHtml = '<br>';
            if (window.getSelection) {
                let next = window.getSelection().focusNode.nextSibling;
                do {
                    if (!next || next.nodeValue || 'BR' === (next as HTMLElement).tagName) {
                        break;
                    }
                } while (next = next.nextSibling);
                next || (insertHtml += insertHtml);
                if (next && next.nodeName === '#text' && insertHtml !== '<br><br>' &&
                    event.target.innerHTML && !event.target.innerHTML.match(/<br>$/ig)) {
                    insertHtml += insertHtml;
                }
                if (!event.target.innerHTML) {
                    insertHtml += insertHtml;
                }
            }
            const userAgent = navigator.userAgent;
            const isSafari = userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1;
            // safari自身可以换行，不用处理
            if (!isSafari) {
                Util.insertAtCursor(this.contentDiv, insertHtml, false);
            }
        } else if (event.keyCode === 13) {
            this.sendMsgAction();
            event.preventDefault();
        }
    }
    private contentFocus() {
        this.contentDiv.focus();
        Util.focusLast(this.contentDiv);
    }
    // 视频开始加载
    private videoLoadStart(index) {
        const that = this;
        this.messageList[index].content.timer4 = setInterval(function () {
            if (!that.messageList[index] || !that.messageList[index].content) {
                clearInterval(this);
                return ;
            }
            if (that.messageList[index].content.range < 90) {
                that.messageList[index].content.range ++;
            }
        }, 100);
    }
    // 视频加载完成
    private videoLoad(index) {
        this.messageList[index].content.duration =
            Math.ceil(this.elementRef.nativeElement.querySelector('#video2' + index).duration);
        this.messageList[index].content.load = 1;
        clearInterval(this.messageList[index].content.timer4);
        this.messageList[index].content.range = 0;
    }
    private playVideo(url) {
        this.videoPlay.emit(url);
    }
    // 播放语音
    private playVoice(index) {
        const audio = this.elementRef.nativeElement.querySelector('#audio2' + index);
        if (audio.paused) {
            this.clearVoicePlay(index);
            audio.play();
            this.messageList[index].content.playing = true;
            // 如果是未读
            if (!this.messageList[index].content.havePlay) {
                let voiceState = {
                    id: this.enter.id,
                    msgId: this.messageList[index].msg_id
                };
                this.voiceState.push(voiceState);
                this.messageList[index].content.havePlay = true;
                const key = `voiceRoomState-${authPayload.appKey}-${global.user}`;
                const value = JSON.stringify(this.voiceState);
                this.storageService.set(key, value);
            }
        } else {
            audio.pause();
            this.messageList[index].content.playing = false;
        }
    }
    // 清除语音播放
    private clearVoicePlay(index) {
        for (let i = 0; i < this.messageList.length; i++) {
            let content = this.messageList[i].content;
            if (content.msg_type === 'voice' && content.playing && i !== index) {
                const otherAudio = this.elementRef.nativeElement.querySelector('#audio2' + i);
                otherAudio.pause();
                otherAudio.currentTime = 0;
                content.playing = false;
            }
        }
    }
    // 语音播放完成
    private voiceEnded(index) {
        const audio = this.elementRef.nativeElement.querySelector('#audio2' + index);
        this.messageList[index].content.playing = false;
        audio.currentTime = 0;
        audio.pause();
    }
    // 语音加载完成
    private voiceLoad(index) {
        const audio = this.elementRef.nativeElement.querySelector('#audio' + index);
        this.messageList[index].content.load = 1;
    }
}

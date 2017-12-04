import { md5 } from '../tools';
import { authPayload } from '../common';
import '../tools/dict/pinyin_dict_notone.js';
import '../tools/pinyinUtil.js';
declare const pinyinUtil;
declare const BMap;

export abstract class Util {
    /**
     * 将input file转化成formData对象
     * @param file: Object
     * @return Object FormData对象
     */
    public static getFileFormData(file) {
        let fd = new FormData();
        fd.append(file.files[0].name, file.files[0]);
        return fd;
    }
    /**
     * 发送文件时截取后缀名作为拓展字段
     * @param name string
     * @return string 后缀名
     */
    public static getExt(name: string): string {
        const index = name.lastIndexOf('.');
        return index === -1 ? '' : name.substring(index + 1);
    }
    /**
     * 将文件后缀名分类
     * @param ext string
     * @return string 后缀名
     */
    public static sortByExt(ext: string): string {
        if (ext === '') {
            return 'other';
        }
        const audio = ['wav', 'mp3', 'wma', 'midi'];
        const document = ['ppt', 'pptx', 'doc', 'docx', 'pdf', 'xls', 'xlsx', 'txt', 'wps'];
        const video = ['mp4', 'mov', 'rm', 'rmvb', 'wmv', 'avi', '3gp', 'mkv'];
        const image = ['jpg', 'jpeg', 'png', 'bmp', 'gif'];
        let newType = '';
        if (audio.indexOf(ext) !== -1) {
            // 音频
            newType = 'audio';
        } else if (document.indexOf(ext) !== -1) {
            // 文档
            newType = 'document';
        } else if (video.indexOf(ext) !== -1) {
            // 视频
            newType = 'video';
        } else if (image.indexOf(ext) !== -1) {
            // 图片
            newType = 'image';
        } else {
            // 其他
            newType = 'other';
        }
        return newType;
    }
    /**
     * doubleNumber 将数字格式化成两位数，如9转化成09，15还是转化成15
     * @param num: 一位或者两位整数
     * @return string 两位的字符串
     */
    public static doubleNumber(num: number): string {
        return num < 10 ? '0' + num : num.toString();
    }
    /**
     * fileReader预览图片返回img url
     * @param file: Object, input file 对象
     * @param callback: function 回调函数
     * @param callback2: function 回调函数
     */
    public static imgReader(file, callback ?: Function, callback2 ?: Function): void | boolean {
        let files = file.files[0];
        if (!/image\/\w+/.test(files.type)) {
            callback();
            return false;
        }
        let reader = new FileReader();
        reader.readAsDataURL(files);
        let img = new Image();
        let promise = new Promise((resolve, reject) => {
            reader.onload = function(e){
                img.src = this.result;
                let that = this;
                img.onload = function(){
                    let width = img.naturalWidth;
                    let height = img.naturalHeight;
                    resolve({
                        src: that.result,
                        width,
                        height
                    });
                };
            };
        }).catch(() => {
            console.log('Promise Rejected');
        });
        promise.then((value) => {
            callback2(value);
        }, (error) => {
            // pass
        }).catch(() => {
            console.log('Promise Rejected');
        });
    }
    /**
     * 获取头像裁剪的预览对象
     * @param file input dom 对象的files[0]
     * @param callback1 回调函数1
     * @param callback2 回调函数2
     * @param callback3 回调函数3
     */
    public static getAvatarImgObj
        (file, callback1: Function, callback2: Function, callback3: Function): void | boolean {
        if (!file || !file.type || file.type === '') {
            return false;
        }
        if (!/image\/\w+/.test(file.type)) {
            callback1();
            return false;
        }
        const that = this;
        let img = new Image();
        let pasteFile = file;
        let reader = new FileReader();
        reader.readAsDataURL(pasteFile);
        let fd = new FormData();
        fd.append(file.name, file);
        reader.onload = function(e) {
            img.src = this.result;
            const _this = this;
            img.onload = function() {
                // 如果选择的图片尺寸小于60*60，弹窗提示
                if (img.naturalWidth < 60 || img.naturalHeight < 60) {
                    callback2();
                    return ;
                }
                callback3(_this, pasteFile, img);
            };
        };
    }
    /**
     * fileReader预览图片url
     * @param file: Object, input file 对象
     * @param callback: function 回调函数
     */
    public static fileReader(file, callback ?: Function): Promise<any> | boolean {
        let files = file.files[0];
        if (!files.type || files.type === '') {
            return false;
        }
        if (!/image\/\w+/.test(files.type)) {
            callback();
            return false;
        }
        let reader = new FileReader();
        reader.readAsDataURL(files);
        return new Promise((resolve, reject) => {
            reader.onload = function(e){
                resolve(this.result);
            };
        }).catch(() => {
            console.log('Promise Rejected');
        });
    }
    /**
     * contenteditable输入框插入内容（表情、粘贴文本等）
     * @param field: Object  输入框dom对象
     * @param value: string 需要插入的内容
     * @param selectPastedContent: boolean 选中内容还是开始点和结束点一致
     */
    public static insertAtCursor(field, value: string, selectPastedContent?: boolean): void {
        let sel;
        let range;
        field.focus();
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();
                let el = document.createElement('div');
                el.innerHTML = value;
                let frag = document.createDocumentFragment();
                let node;
                let lastNode;
                while ((node = el.firstChild)) {
                    lastNode = frag.appendChild(node);
                }
                let firstNode = frag.firstChild;
                range.insertNode(frag);
                if (lastNode) {
                    range = range.cloneRange();
                    range.setStartAfter(lastNode);
                    if (selectPastedContent) {
                        range.setStartBefore(firstNode);
                    } else {
                        range.collapse(true);
                    }
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        }
    }
    /**
     * contenteditable输入框光标聚焦到最后
     * @param obj: Object  输入框dom对象
     */
    public static focusLast(obj): void {
        if (window.getSelection) {
            const range = window.getSelection();
            range.selectAllChildren(obj);
            range.collapse(obj, obj.childNodes.length);
        }
    }
    /**
     * 判断字符串首字母是否是中文
     * @param str: string  需要操作的字符串
     * @return boolean
     */
    public static firstLetterIsChinese(str: string): boolean {
        const re = /^[\\u4e00-\\u9fa5]/;
        return re.test(str) ? false : true ;
    }
    /**
     * 将数组中的字符串按照首字母及中文拼音首字母排序
     * @param payload: array 需要排序的数组
     * @return array 排好序的数组array
     */
    public static sortByLetter(payload: any[]): any[] {
        const letter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
            'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'];
        let result = [];
        for (let item of letter) {
            result.push({
                letter: item,
                data: []
            });
        }
        for (let item of payload) {
            let flag = false;
            for (let re of result) {
                let name;
                if (item.memo_name && item.memo_name !== '') {
                    name = item.memo_name;
                } else if (item.nickName && item.nickName !== '') {
                    name = item.nickName;
                } else {
                    name = item.name;
                }
                if (!name || name.length === 0) {
                    break;
                }
                let firstLetter = name.charAt(0);
                if (name.match(/^[a-zA-Z]/)) {
                    if (firstLetter.toUpperCase() === re.letter) {
                        re.data.push(item);
                        flag = true;
                        break;
                    }
                }else if (this.firstLetterIsChinese(name)) {
                    let py = pinyinUtil.getFirstLetter(name, false)[0];
                    if (py && py.toUpperCase() === re.letter) {
                        re.data.push(item);
                        flag = true;
                        break;
                    }
                }
            }
            if (!flag) {
                result[result.length - 1].data.push(item);
            }
        }
        return result;
    }
    /**
     * 将元素插入按首字母排序的数组中
     * @param arr: array 之前排好序的数组
     * @param payload: Object  需要插入的元素
     * @return array 插入元素之后的数组
     */
    public static insertSortByLetter(arr: any[], payload): any[] {
        const name =
                (payload.nickName && payload.nickName !== '') ? payload.nickName : payload.name;
        const firstLetter = this.getFirstLetter(name);
        for (let item of arr) {
            if (item.letter === firstLetter) {
                let result = item.data.filter((friend) => {
                    return friend.name === payload.name;
                });
                if (result.length === 0) {
                    item.data.push(payload);
                }
                break;
            }
        }
        return arr;
    }
    /**
     * 获取首字母
     * @param name: 要获取首字母的字符串
     * @return string 首字母
     */
    public static getFirstLetter(name: string): string {
        let firstLetter = name.charAt(0);
        if (name.match(/^[a-zA-Z]/)) {
            firstLetter = firstLetter.toUpperCase();
        } else if (this.firstLetterIsChinese(name)) {
            let py = pinyinUtil.getFirstLetter(firstLetter, false)[0];
            if (py) {
                firstLetter = py.toUpperCase();
            } else {
                firstLetter = '#';
            }
        } else {
            firstLetter = '#';
        }
        return firstLetter;
    }
    /**
     * 获取成员备注名、昵称、用户名首字母
     * @param arr: 成员列表
     */
    public static getMembersFirstLetter(arr: any[]): void {
        for (let item of arr) {
            if (item.nickName && item.nickName !== '') {
                item.nickNameFirstLetter = this.getFirstLetter(item.nickName);
            }
            if (item.username && item.username !== '') {
                item.usernameFirstLetter = this.getFirstLetter(item.username);
            }
            if (item.memo_name && item.memo_name !== '') {
                item.memo_nameFirstLetter = this.getFirstLetter(item.memo_name);
            }
        }
    }
    /**
     * 获取备注名首字母
     * @param member: 用户对象
     */
    public static getMemo_nameFirstLetter(member): void {
        if (member.memo_name && member.memo_name !== '') {
            member.memo_nameFirstLetter = this.getFirstLetter(member.memo_name);
        }
    }
    /**
     * 将接收到的地理定位坐标转化为地图
     * @param obj: Object 坐标对象
     */
    public static theLocation(obj): void {
        let point = new BMap.Point(obj.longitude, obj.latitude);
        let map = new BMap.Map(obj.id);
        // 默认缩放比例是13
        let scale = 13;
        if (obj.scale && !Number.isNaN(Number(obj.scale))) {
            // 百度地图的缩放比例为1到19的整数
            if (scale >= 1 && scale < 20) {
                scale = Math.floor(Number(obj.scale));
            }
        }
        map.centerAndZoom(point, scale);
        map.disableDragging();
        if (obj.scroll) {
            map.enableScrollWheelZoom(true);
            map.enableDragging();
        }
        let marker = new BMap.Marker(point);
        map.addOverlay(marker);
        map.panTo(point);
    }
    /**
     * 将时间转化成需要的格式
     * @param msgTime: 需要转换的时间毫秒数
     * @return string 时间的标识，根据标识可以再页面应用不同的date管道
     * 当天 --- today
     * 昨天和前天 --- yesterday或the day before
     * 近7天（排除今天，昨天，前天） --- day
     * 今年其他时间 --- month
     * 今年之前的时间 --- year
     */
    public static reducerDate(msgTime: number): string {
        const time = new Date(msgTime);
        const now = new Date();
        const msgYear = time.getFullYear();
        const nowYear = now.getFullYear();
        const nowHour = now.getHours();
        const nowMinute = now.getMinutes();
        const nowSecond = now.getSeconds();
        const nowTime = now.getTime();
        const todayTime = nowHour * 60 * 1000 * 60 + nowMinute * 1000 * 60 + nowSecond * 1000;
        const gapDate = (nowTime - todayTime - msgTime) / 1000 / 60 / 60 / 24;
        let showTime = '';
        if (msgYear !== nowYear) {
            showTime = 'year';
        } else if (gapDate > 6) {
            showTime = 'month';
        } else if (gapDate <= 6 && gapDate > 2) {
            showTime = 'day';
        } else if (gapDate <= 2 && gapDate > 1) {
            showTime = 'the day before';
        } else if (gapDate <= 1 && gapDate > 0) {
            showTime = 'yesterday';
        } else if (gapDate <= 0) {
            showTime = 'today';
        }
        return showTime;
    }
    /**
     * 判断两个时间间隔是否超过5分钟
     * @param oldTime: number
     * @param newTime: number
     * @return boolean
     */
    public static fiveMinutes(oldTime: number, newTime: number): boolean {
        const gap = newTime - oldTime;
        return gap / 1000 / 60 > 5 ? true : false;
    }
    /**
     * 获取当前光标的在页面中的位置
     * @param input: dom obj 输入框的dom元素
     * @return object 光标的位置
     */
    public static getOffset(input) {
        const sel = window.getSelection();
        const range = sel.getRangeAt(0);
        let offset;
        if (!this.isSafari()) {
            offset = range.getBoundingClientRect();
        } else {
            let clonedRange;
            let rect;
            let shadowCaret;
            clonedRange = range.cloneRange();
            clonedRange.setStart(range.endContainer, range.endOffset - 1);
            clonedRange.setEnd(range.endContainer, range.endOffset);
            rect = clonedRange.getBoundingClientRect();
            offset = {
                height: rect.height,
                left: rect.left + rect.width,
                top: rect.top
            };
            clonedRange.detach();
            if (input.innerHTML === '@') {
                clonedRange = range.cloneRange();
                shadowCaret = document.createTextNode('|');
                clonedRange.insertNode(shadowCaret);
                clonedRange.selectNode(shadowCaret);
                rect = clonedRange.getBoundingClientRect();
                offset = {
                    height: rect.height,
                    left: rect.left,
                    top: rect.top
                };
                input.innerHTML = '@';
                this.focusLast(input);
                clonedRange.detach();
            }
        }
        return offset;
    }
    /**
     * 深度拷贝对象
     * @param obj: object 需要拷贝的对象
     * @return result 新的对象
     */
    public static deepCopyObj(obj: object) {
        return JSON.parse(JSON.stringify(obj));
    }
    /**
     * 生成JIM初始化的签名
     * @param timestamp: number 当前的时间毫秒数
     * @return string 签名
     */
    public static createSignature(timestamp: number): string {
        return md5(`appkey=${authPayload.appKey}&timestamp=${timestamp}&random_str=${authPayload.randomStr}&key=${authPayload.masterkey}`);
    }
    /**
     * 处理头像的大小
     * @param event: object 头像dom的事件对象
     */
    public static reduceAvatarSize(event): void {
        if (event.target.naturalHeight >= event.target.naturalWidth) {
            event.target.style.width = '100%';
            event.target.style.height = 'auto';
        } else {
            event.target.style.height = '100%';
            event.target.style.width = 'auto';
        }
    }
    /**
     * 判断是否是safari浏览器
     * @return boolean
     */
    public static isSafari(): boolean {
        const userAgent = navigator.userAgent;
        return userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1;
    }
    constructor() {
        // pass
    }
}

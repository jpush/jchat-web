import { Pipe, PipeTransform } from '@angular/core';
/**
 * 将不同后缀名的文件分类
 */
@Pipe({
    name: 'fileType'
})
export class FileTypePipe implements PipeTransform {
  public transform(ext) {
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
}

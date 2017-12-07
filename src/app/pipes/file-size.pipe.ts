import { Pipe, PipeTransform } from '@angular/core';
/**
 * 将文件的大小格式化
 */
@Pipe({
    name: 'fileSize'
})

export class FileSizePipe implements PipeTransform {
    public transform(size: number): string {
        let newSize = '';
        if (size > 1024 * 1024) {
            newSize = (size / (1024 * 1024)).toFixed(2) + 'M';
        } else {
            let sizeNum = (size / 1024).toFixed(2);
            // 小于0.01KB的文件显示0.01KB
            newSize = (Number(sizeNum) >= 0.01 ? sizeNum : 0.01) + 'KB';
        }
        return newSize;
    }
}

import { Pipe, PipeTransform } from '@angular/core';
import { Util } from '../services/util';

/**
 * 将不同后缀名的文件分类
 */

@Pipe({
    name: 'fileType'
})

export class FileTypePipe implements PipeTransform {
    public transform(ext: string): string {
        return Util.sortByExt(ext);
    }
}

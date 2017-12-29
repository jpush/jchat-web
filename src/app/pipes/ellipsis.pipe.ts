import { Pipe, PipeTransform } from '@angular/core';
/**
 * 将文本截取相应长度的字符串输出，多行文本溢出隐藏
 */
@Pipe({
    name: 'ellipsis'
})

export class EllipsisPipe implements PipeTransform {
    public transform(str: string, num: number): string {
        return str.length > num ? str.substr(0, num) + '...' : str;
    }
}

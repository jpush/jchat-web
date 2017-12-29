import { Pipe, PipeTransform } from '@angular/core';
import { Util } from '../services/util';
/**
 * 将毫秒数转化固定的日期格式，为了解决angular2原生的date管道在IE11下的兼容问题
 */
@Pipe({
    name: 'datePipe'
})

export class MyDatePipe implements PipeTransform {
    public transform(time: number): string {
        const newDate = new Date(time);
        const year = newDate.getFullYear();
        const month = Util.doubleNumber(newDate.getMonth() + 1);
        const date = Util.doubleNumber(newDate.getDate());
        return `${year}-${month}-${date}`;
    }
}

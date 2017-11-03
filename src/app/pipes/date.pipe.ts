import { Pipe, PipeTransform } from '@angular/core';
/**
 * 将毫秒数转化固定的日期格式，为了解决angular2原生的date管道在IE11下的兼容问题
 */
@Pipe({
    name: 'datePipe'
})

export class DatePipe implements PipeTransform {
    public transform(time): string {
        const newDate = new Date(time);
        const year = newDate.getFullYear();
        const month = this.doubleTime(newDate.getMonth() + 1);
        const date = this.doubleTime(newDate.getDate());
        return `${year}-${month}-${date}`;
    }
    private doubleTime(num) {
        return num < 10 ? '0' + num : num;
    }
}

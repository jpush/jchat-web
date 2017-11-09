import { Pipe, PipeTransform } from '@angular/core';
/**
 * 将毫秒数转化成星期几
 */
@Pipe({
    name: 'day'
})
export class DayPipe implements PipeTransform {
  public transform(time): string {
    let day = (new Date(time)).getDay();
    let dayText = '';
    switch (day) {
        case 0:
            dayText = '星期日';
            break;
        case 1:
            dayText = '星期一';
            break;
        case 2:
            dayText = '星期二';
            break;
        case 3:
            dayText = '星期三';
            break;
        case 4:
            dayText = '星期四';
            break;
        case 5:
            dayText = '星期五';
            break;
        case 6:
            dayText = '星期六';
            break;
        default:
    }
    return dayText;
  }
}

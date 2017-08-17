import { Pipe, PipeTransform } from '@angular/core';
/**
 * 将video的时长转化成'00:00'格式
 */
@Pipe({
    name: 'videoTime'
})
export class VideoTimePipe implements PipeTransform {
  public transform(time): string {
    let newTime;
    time = Math.floor(time);
    if (time < 10) {
        newTime = '00:0' + time;
    } else if (time >= 10 && time < 60) {
        newTime = '00:' + time;
    } else if (time >= 60 && time < 3600) {
        let minute = Math.floor(time / 60);
        let second = Math.round(time % 60);
        if (minute >= 10 && second >= 10) {
            newTime = minute + ':' + second;
        } else if (minute >= 10 && second < 10) {
            newTime = minute + ':0' + second;
        } else if (minute < 10 && second >= 10) {
            newTime = '0' + minute + ':' + second;
        } else if (minute < 10 && second < 10) {
            newTime = '0' + minute + ':0' + second;
        }
    }
    return newTime;
  }
}

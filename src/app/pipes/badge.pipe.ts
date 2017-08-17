import { Pipe, PipeTransform } from '@angular/core';
/**
 * 格式化徽标提示的消息数量
 */
@Pipe({
    name: 'badge'
})
export class BadgePipe implements PipeTransform {
  public transform(num) {
    return num > 99 ? '99+' : num;
  }
}

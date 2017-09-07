import { Pipe, PipeTransform } from '@angular/core';
/**
 * 将毫秒数转化固定的日期格式，为了解决angular2原生的date管道在IE11下的兼容问题
 */
@Pipe({
    name: 'fileName'
})
export class FileNamePipe implements PipeTransform {
    public transform(fileName, num): string {
        const index = fileName.lastIndexOf('.');
        let newName = '';
        if (index === -1) {
            if (fileName.length > num) {
                newName = fileName.substr(0, num - 3) + '...';
            } else {
                newName = fileName;
            }
        } else {
            const name = fileName.substring(0, index);
            const ext = fileName.substring(index);
            if (name.length > num - ext.length && num > 5 + ext.length) {
                const lastStr = name.substring(name.length - 2);
                const firstStr = name.substr(0, num - ext.length - 2 - 3);
                newName = `${firstStr}...${lastStr}${ext}`;
            } else {
                newName = fileName;
            }
        }
        return newName;
    }
}

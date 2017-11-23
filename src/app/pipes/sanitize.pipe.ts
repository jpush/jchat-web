import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * 防止xss攻击(html, url)
 */
@Pipe({
    name: 'sanitize'
})

export class SanitizePipe implements PipeTransform {
    constructor(
       private sanitizer: DomSanitizer
    ) { }
    public transform(value: string, type: string) {
        if (!value) {
            return '';
        }
        if (type === 'html') {
            return this.sanitizer.bypassSecurityTrustHtml(value);
        } else if (type === 'url') {
            return this.sanitizer.bypassSecurityTrustUrl(value);
        }
    }
}

import { Pipe, PipeTransform } from '@angular/core';
import { Emoji } from '../services/tools';
/**
 * 将原始表情转化成unicode编码，并正则替换<>\n\s
 */
@Pipe({
    name: 'emoji'
})

export class EmojiPipe implements PipeTransform {
    public transform(text: string, option): string {
        let newText = text.replace(/</g, '&lt;');
        newText = newText.replace(/>/g, '&gt;');
        // 匹配url地址
        if (option.href) {
          	const regUrl = /((http:\/\/|https:\/\/)((\w|=|\?|\.|\/|&|-|%|#|\+|:|;|\\|`|~|!|@|\$|\^|\*|\(|\)|<|>|？|{|}|\[|\]|[\u4e00-\u9fa5])+)){1}/g;
          	let arr = newText.match(regUrl);
          	if (arr && arr.length > 0) {
            	for (let item of arr) {
              	newText = newText.replace(item,
                `<a href='${item}' class='text-href' target='_blank'>${item}</a>`);
            	}
          	}
        }
        newText = newText.replace(/\n/g, '<br>');
        // 匹配nbsp
        if (option.nbsp) {
			newText = newText.replace(/\s/g, '&nbsp;');
			const reg = /<a.+?href='(.+?)'.+?class='text-href'.+?target='_blank'>(.+?)<\/a>/g;
			let arr = newText.match(reg);
			if (arr && arr.length > 0) {
				for (let item of arr) {
					item.match(reg);
					newText = newText.replace(item,
						`<a href='${RegExp.$1}' class='text-href' target='_blank'>${RegExp.$1}</a>`);
				}
			}
        }
        newText = Emoji.emoji(newText, option.fontSize);
        return newText;
    }
}

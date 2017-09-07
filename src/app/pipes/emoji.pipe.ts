import { Pipe, PipeTransform } from '@angular/core';
import { Emoji } from '../services/tools';
/**
 * 将原始表情转化成unicode编码，并正则替换<>\n\s
 */
@Pipe({
    name: 'emoji'
})
export class EmojiPipe implements PipeTransform {
  public transform(text, option) {
    let newText = text.replace(/</g, '&lt;');
    newText = newText.replace(/>/g, '&gt;');
    // 匹配url地址
    if (option.href) {
      let regUrl = /(http:\/\/|https:\/\/)((\w|=|\?|\.|\/|&|-|%|#|\+|:|;|\\|`|~|!|@|\$|\^|\*|\(|\)|<|>|？|{|}|\[|\]|[\u4e00-\u9fa5])+)/g;
      newText = newText.replace(regUrl,
              "<a href='$1$2' class='text-href' target='_blank'>$1$2</a>");
    }
    newText = newText.replace(/\n/g, '<br>');
    // 匹配nbsp
    if (option.nbsp) {
      newText = newText.replace(/\s/g, '&nbsp;');
      newText = newText.replace(/<a.+href='(.+)'.+class='text-href'.+target='_blank'>(.+)<\/a>/g,
              "<a href='$1' class='text-href' target='_blank'>$1</a>");
    }
    newText = Emoji.emoji(newText);
    return newText;
  }
}

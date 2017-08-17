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
    newText = newText.replace(/\n/g, '<br>');
    // 匹配nbsp
    if (option.nbsp) {
      newText = newText.replace(/\s/g, '&nbsp;');
    }
    // 匹配url地址
    if (option.href) {
      let regUrl = /(http:\/\/|https:\/\/)((\w|=|\?|\.|\/|&|-|%|#|\+|:)+)/g;
      newText = newText.replace(regUrl,
              "<a href='$1$2' class='text-href' target='_blank'>$1$2</a>").replace(/\n/g, '<br />');
    }
    newText = Emoji.emoji(newText);
    return newText;
  }
}

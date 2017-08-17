import { Pipe, PipeTransform } from '@angular/core';
import { Emoji } from '../services/tools';
/**
 * 将原始表情转化成unicode编码，并正则替换<>\n\s
 */
@Pipe({
    name: 'emoji'
})
export class EmojiPipe implements PipeTransform {
  public transform(text, nbsp) {
    let newText = text.replace(/</g, '&lt;');
    newText = newText.replace(/>/g, '&gt;');
    newText = newText.replace(/\n/g, '<br>');
    if (nbsp) {
      newText = newText.replace(/\s/g, '&nbsp;');
    }
    newText = Emoji.emoji(newText);
    return newText;
  }
}

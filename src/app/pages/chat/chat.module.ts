import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { ChatComponent } from './chat.component';
import { ConversationListModule } from '../../components/conversation-list';
import { ChatPanelModule } from '../../components/chat-panel';
import { DefaultPanelModule } from '../../components/default-panel';
import { OtherInfoModule } from '../../components/other-info';
import { GroupSettingModule } from '../../components/group-setting';
import { GroupDescriptionModule } from '../../components/group-description';
import { VideoModule } from '../../components/video';
import { MessageTransmitModule } from '../../components/message-transmit';

@NgModule({
  declarations: [
    ChatComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ConversationListModule,
    ChatPanelModule,
    DefaultPanelModule,
    OtherInfoModule,
    GroupSettingModule,
    GroupDescriptionModule,
    VideoModule,
    MessageTransmitModule
  ],
  exports: [
      ChatComponent
  ],
  providers: [
  ]
})
export class ChatModule {}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MAIN_ROUTER } from './main.router';
import { MainComponent } from './main.component';
import { ConversationListModule } from '../../components/conversation-list';
import { SelfInfoModule } from '../../components/self-info';
import { CreateGroupModule } from '../../components/create-group';
import { GroupListModule } from '../../components/group-list';
import { ModifyPasswordModule } from '../../components/modify-password';
import { ChatPanelModule } from '../../components/chat-panel';
import { DefaultPanelModule } from '../../components/default-panel';
import { SearchUserModule } from '../../components/search-user';
import { OtherInfoModule } from '../../components/other-info';
import { TipModalModule } from '../../components/tip-modal';
import { CreateSingleChatModule } from '../../components/create-single-chat';
import { BlackMenuModule } from '../../components/black-menu';
import { ContactListModule } from '../../components/contact-list';
import { GroupSettingModule } from '../../components/group-setting';
import { MenuModule } from '../../components/menu';
import { HoverTipModule } from '../../components/hover-tip';
import { ChatModule } from '../chat';
import { ContactModule } from '../contact';
import { RoomModule } from '../room';
import { HoverEventModule } from '../../directives';
import { LogoutKickModule } from '../../components//logout-kick';
import { SanitizePipeModule } from '../../pipes';
import { BadgeModule } from 'jpush-ui/badge';
import { EnterGroupModule } from '../../components/enter-group';
import { GroupInfoModule } from '../../components/group-info';
import { VerifyModalModule } from '../../components/verify-modal';
import { CreateGroupNextModule } from '../../components/create-group-next';
import { GroupAvatarModule } from '../../components/group-avatar';

@NgModule({
  declarations: [
    MainComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(MAIN_ROUTER),
    ConversationListModule,
    SelfInfoModule,
    CreateGroupModule,
    GroupListModule,
    ModifyPasswordModule,
    ChatPanelModule,
    DefaultPanelModule,
    SearchUserModule,
    OtherInfoModule,
    TipModalModule,
    CreateSingleChatModule,
    BlackMenuModule,
    ContactListModule,
    GroupSettingModule,
    ChatModule,
    ContactModule,
    RoomModule,
    MenuModule,
    HoverTipModule,
    HoverEventModule,
    LogoutKickModule,
    BadgeModule,
    SanitizePipeModule,
    EnterGroupModule,
    GroupInfoModule,
    VerifyModalModule,
    CreateGroupNextModule,
    GroupAvatarModule
  ],
  providers: [
  ]
})
export class MainModule {
  public static routes = MAIN_ROUTER;
}

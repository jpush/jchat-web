import { NgModule } from '@angular/core';
import { AtListModule } from '../at-list';
import { BlackMenuModule } from '../black-menu';
import { CardModalModule } from '../card-modal';
import { ChatPanelModule } from '../chat-panel';
import { ContactListModule } from '../contact-list';
import { ConversationListModule } from '../conversation-list';
import { CreateGroupModule } from '../create-group';
import { CreateGroupNextModule } from '../create-group-next';
import { CreateSingleChatModule } from '../create-single-chat';
import { DefaultPanelModule } from '../default-panel';
import { DropFileModule } from '../drop-file';
import { EmojiModule } from '../emoji';
import { EnterGroupModule } from '../enter-group';
import { GroupAvatarModule } from '../group-avatar';
import { GroupDescriptionModule } from '../group-description';
import { GroupInfoModule } from '../group-info';
import { GroupListModule } from '../group-list';
import { GroupSettingModule } from '../group-setting';
import { HoverTipModule } from '../hover-tip';
import { ImageViewerModule } from '../image-viewer';
import { InfoMenuModule } from '../info-menu';
import { LinkmanListModule } from '../linkman-list';
import { LogoutKickModule } from '../logout-kick';
import { MenuModule } from '../menu';
import { MessageFileModule } from '../message-file';
import { MessageMenuModule } from '../message-menu';
import { MessageTransmitModule } from '../message-transmit';
import { ModifyPasswordModule } from '../modify-password';
import { OtherInfoModule } from '../other-info';
import { PasteImageModule } from '../paste-image';
import { RoomDetailModule } from '../room-detail';
import { RoomInfomationModule } from '../room-infomation';
import { RoomListModule } from '../room-list';
import { RoomPanelModule } from '../room-panel';
import { SearchCardModule } from '../search-card';
import { SearchMemberModule } from '../search-member';
import { SearchTransmitModule } from '../search-transmit';
import { SearchUserModule } from '../search-user';
import { SelectModule } from '../select';
import { SelfInfoModule } from '../self-info';
import { SwitchModule } from '../switch';
import { TipModalModule } from '../tip-modal';
import { UnreadListModule } from '../unread-list';
import { VerifyModule } from '../verify';
import { VerifyModalModule } from '../verify-modal';
import { VideoModule } from '../video';
import { BadgeModule } from 'jpush-ui/badge';

@NgModule({
    declarations: [
        // pass
    ],
    imports: [
        // pass
    ],
    exports: [
        AtListModule,
        BlackMenuModule,
        CardModalModule,
        ChatPanelModule,
        ContactListModule,
        ConversationListModule,
        CreateGroupModule,
        CreateGroupNextModule,
        CreateSingleChatModule,
        DefaultPanelModule,
        DropFileModule,
        EmojiModule,
        EnterGroupModule,
        GroupAvatarModule,
        GroupDescriptionModule,
        GroupInfoModule,
        GroupListModule,
        GroupSettingModule,
        HoverTipModule,
        ImageViewerModule,
        InfoMenuModule,
        LinkmanListModule,
        LogoutKickModule,
        MenuModule,
        MessageFileModule,
        MessageMenuModule,
        MessageTransmitModule,
        ModifyPasswordModule,
        OtherInfoModule,
        PasteImageModule,
        RoomDetailModule,
        RoomInfomationModule,
        RoomListModule,
        RoomPanelModule,
        SearchCardModule,
        SearchMemberModule,
        SearchTransmitModule,
        SearchUserModule,
        SelectModule,
        SelfInfoModule,
        SwitchModule,
        TipModalModule,
        UnreadListModule,
        VerifyModule,
        VerifyModalModule,
        VideoModule,
        BadgeModule
    ],
    providers: []
})

export class SharedComponentModule { }

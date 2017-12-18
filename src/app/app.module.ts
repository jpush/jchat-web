import { NgModule, ApplicationRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule, } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
// import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { appReducer } from './reducers';
import { loginReducer } from './pages/login/reducers';
import { LoginEffect } from './pages/login/effects';
import { registerReducer } from './pages/register/reducers';
import { RegisterEffect } from './pages/register/effects';
import { mainReducer } from './pages/main/reducers';
import { MainEffect } from './pages/main/effects';
import { chatReducer } from './pages/chat/reducers';
import { ChatEffect } from './pages/chat/effects';
import { contactReducer } from './pages/contact/reducers';
import { ContactEffect } from './pages/contact/effects';
import { roomReducer } from './pages/room/reducers';
import { RoomEffect } from './pages/room/effects';
import { MainCanActivate } from './services/common';
import { TipModalModule } from './components/tip-modal';
import { HMR } from '../config/hmr';
import { routing } from './app.router';
import { AppComponent } from './app.component';
import { StorageService, PreloadService, ApiService } from './services/common';
import '../assets/css/common.scss';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        routing,
        StoreModule.provideStore({
            appReducer,
            loginReducer,
            registerReducer,
            mainReducer,
            chatReducer,
            contactReducer,
            roomReducer
        }),
        EffectsModule.run(LoginEffect),
        EffectsModule.run(RegisterEffect),
        EffectsModule.run(MainEffect),
        EffectsModule.run(ChatEffect),
        EffectsModule.run(ContactEffect),
        EffectsModule.run(RoomEffect),
        TipModalModule
        // 是否启用ngrx调试工具
        // StoreDevtoolsModule.instrumentOnlyWithExtension(),
    ],
    declarations: [
        AppComponent
    ],
    bootstrap: [AppComponent],
    providers: [
        MainCanActivate,
        StorageService,
        PreloadService,
        ApiService
    ]
})
export class AppModule extends HMR {
    constructor(public appRef: ApplicationRef) {
        super(appRef);
    }
}

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LOGIN_ROUTER } from './login.router';
import { LoginComponent } from './login.component';
import { loginReducer } from './reducers';
import { LoginEffect } from './effects';

@NgModule({
    declarations: [
        LoginComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild(LOGIN_ROUTER)
    ],
    providers: [
    ]
})
export class LoginModule {
  public static routes = LOGIN_ROUTER;
}

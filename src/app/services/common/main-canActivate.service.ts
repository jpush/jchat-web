import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { StorageService } from './storage.service';
import { global } from './global';
import { authPayload } from './config';
import { md5 } from '../../services/tools';
import { Util } from '../../services/util';

/**
 * main路由的路由守卫服务
 */

@Injectable()
export class MainCanActivate implements CanActivate {
    private username = '';
    private password = '';
    constructor(
        private router: Router,
        private storageService: StorageService
    ) { }
    public canActivate(): boolean | Promise<boolean> {
        // 如果是从登陆界面跳转过来的就直接return true
        if (window.location.href.match(/\/login$/g)) {
            return true;
        }
        // 不是从登陆界面跳转过来的，如刷新时或者是关闭窗口五分钟内重新打开则自动登录
        const storageUsername = this.storageService.get(md5('afterFiveMinutes-username'), true);
        const storagePassword = this.storageService.get(md5('afterFiveMinutes-password'), true);
        if (storageUsername && storagePassword) {
            this.username = storageUsername;
            this.password = storagePassword;
            return new Promise<boolean>((resolve, reject) => {
                this.JIMInit(resolve);
            });
        } else {
            this.router.navigate(['/login']);
            return false;
        }
    }
    private JIMInit(resolve) {
        const timestamp = new Date().getTime();
        const signature = Util.createSignature(timestamp);
        global.JIM.init({
            appkey: authPayload.appkey,
            random_str: authPayload.randomStr,
            signature: authPayload.signature || signature,
            timestamp: authPayload.timestamp || timestamp,
            flag: authPayload.flag
        }).onSuccess((data) => {
            this.autoLogin(resolve);
        }).onFail((data) => {
            resolve(false);
        }).onTimeout((data) => {
            resolve(false);
        });
    }
    private autoLogin(resolve) {
        global.JIM.login({
            username: this.username,
            password: this.password,
            is_md5: true
        }).onSuccess((data) => {
            global.user = data.username;
            global.password = this.password;
            resolve(true);
        }).onFail((data) => {
            resolve(false);
        }).onTimeout((data) => {
            resolve(false);
        });
    }
}

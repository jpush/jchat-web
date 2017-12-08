import { Injectable } from '@angular/core';

/**
 * 前端存储（cookie和localStorage）服务
 */

@Injectable()
export class StorageService {
    constructor() {
        // pass
    }

    public set(key: string, data: string, useCookie?: boolean, time?: any, path?: any) {
        if (localStorage && !useCookie) {
            try {
                localStorage.setItem(key, data);
                return;
            } catch (err) { // 在safari的匿名模式的时候会报错
                // go ahead
            }
        }
        let exp = new Date();
        if (time) {
            exp.setTime(exp.getTime() + time);
        } else {
            exp.setTime(exp.getTime() + 23.9 * 60 * 60 * 1000);
        }
        if (path) {
            document.cookie = key + '=' + data + ';expires=' + exp.toUTCString() + ';path=' + path;
            return null;
        }
        document.cookie = key + '=' + data + ';expires=' + exp.toUTCString();
    }

    public get(key: string, useCookie?: boolean) {
        if (localStorage && !useCookie) {
            let value = localStorage.getItem(key);
            if (value) {
                return value;
            }
        }
        // 从cookie里面取
        let reg = new RegExp(key + '=([^;]*)');
        let m = document.cookie.match(reg);
        if (m && m.length > 1) {
            return m[1];
        }
        return null;
    }

    public remove(key: string, useCookie?: boolean, path?: any) {
        if (localStorage && !useCookie) {
            let value = localStorage.getItem(key);
            if (value) {
                localStorage.removeItem(key);
                return value;
            }
        }
        // 从localstorage里没发现这个key
        let exp = new Date();
        exp.setTime(exp.getTime() - 1);
        let value = this.get(key);
        if (path) {
            document.cookie = key + '=' + value + ';expires=' + exp.toUTCString() + ';path=' + path;
        } else {
            document.cookie = key + '=' + value + ';expires=' + exp.toUTCString();
        }
        return value;
    }
}

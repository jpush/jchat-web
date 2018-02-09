import { Http, RequestOptions, Headers } from '@angular/http';
import { Injectable } from '@angular/core';

@Injectable()
export class SignatureService {
    constructor(
        private http: Http
    ) {}
    public requestSignature(url, data) {
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        let options = new RequestOptions({ headers });
        return this.http.post(url, data, options)
        .map((res: any) => res._body ? res._body : res)
        .toPromise().catch((error) => {
            // 请求服务端签名接口错误
            console.log('请求服务端签名接口错误', error);
        });
    }
}

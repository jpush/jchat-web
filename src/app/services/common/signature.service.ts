import { Http, RequestOptions, Headers } from '@angular/http';
import { Injectable } from '@angular/core';

@Injectable()
export default class SignatureService {
    constructor(
        private http: Http
    ) {}
    public requestSignature(url, data) {
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        let options = new RequestOptions({ headers });
        return this.http.post(url, data, options).toPromise();
    }
}

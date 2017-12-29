import { PreloadingStrategy, Route } from '@angular/router';
import { Observable } from 'rxjs';

// 预加载
export class PreloadService implements PreloadingStrategy {
    public preload(route: Route, load: Function): Observable<any> {
        return route.data && route.data.preload ? load() : Observable.of(null);
    }
}

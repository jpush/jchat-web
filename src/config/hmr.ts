import { ApplicationRef } from '@angular/core';
import { removeNgStyles, createNewHosts } from '@angularclass/hmr';

export class HMR {
    constructor(public appRef: ApplicationRef) {}

    public hmrOnInit(store: any) {
        if (!store) {
            return;
        }
    }

    public hmrOnDestroy(store: any) {
        let cmpLocation = this.appRef.components.map((cmp) => cmp.location.nativeElement);
        // recreate elements
        store.disposeOldHosts = createNewHosts(cmpLocation);
        // remove styles
        removeNgStyles();
    }

    public hmrAfterDestroy(store: any) {
        // display new elements
        store.disposeOldHosts();
        delete store.disposeOldHosts;
        // anything you need done the component is removed
    }
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';

import { AppModule } from './app/app.module';
import { global } from './app/services/common/global';

enableProdMode();
platformBrowserDynamic().bootstrapModule(AppModule)
  .then((componentRef: any) => {
    global.injector = componentRef.injector;
  });

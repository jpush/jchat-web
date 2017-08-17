import {
  platformBrowser
} from '@angular/platform-browser';

import {
  enableProdMode
} from '@angular/core';

import {
  AppModuleNgFactory
} from '../compiled/src/app/app.module.ngfactory';

enableProdMode();
platformBrowser().bootstrapModuleFactory(AppModuleNgFactory);

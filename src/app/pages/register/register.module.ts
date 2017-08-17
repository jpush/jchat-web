import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { REGISTER_ROUTER } from './register.router';
import { RegisterComponent } from './register.component';
import { TipModalModule } from '../../components/tip-modal';

@NgModule({
  declarations: [
    // Components / Directives/ Pipes
    RegisterComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(REGISTER_ROUTER),
    TipModalModule
  ],
  providers: [

  ]
})
export class RegisterModule {
  public static routes = REGISTER_ROUTER;
}

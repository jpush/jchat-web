import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MAPROUTER } from './map.router';
import { MapComponent } from './map.component';

@NgModule({
  declarations: [
    MapComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(MAPROUTER),
  ],
})
export class MapModule {
  public static routes = MAPROUTER;
}

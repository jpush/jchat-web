import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { DefaultPanelComponent } from './default-panel.component';

@NgModule({
  declarations: [
    DefaultPanelComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
      DefaultPanelComponent
  ],
  providers: []
})

export class DefaultPanelModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NotFoundRoutingModule } from './not-found-routing.module';
import { NotFoundComponent } from './not-found.component';

/**
* wrap all components, which are part of declaration of this module
* into one single NgModule, and export NotFoundModule
*/
@NgModule({
  imports: [
    CommonModule,
    NotFoundRoutingModule
  ],
  declarations: [NotFoundComponent]
})
/**
* export NotFoundModule
* so it can be use in project
*/
export class NotFoundModule { }

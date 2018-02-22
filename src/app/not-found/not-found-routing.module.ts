import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NotFoundComponent } from './not-found.component';

/**
* define routes for not-found component
*/
const routes: Routes = [
  { path: '', component: NotFoundComponent, pathMatch: 'full' }
];

/**
* wrap routes into NgModule
*/
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
/**
* Export routing module to use it in not found module
*/
export class NotFoundRoutingModule { }

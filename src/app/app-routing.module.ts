import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { UsersComponent, HomeComponent } from './components';

/**
* Define sub routes
*/
const routes: Routes = [
  { path: '', redirectTo: '/users', pathMatch: 'full' },
  {
    path: 'users', component: HomeComponent,
    pathMatch: 'full',
  },
  {
    path: 'users/:id', component: UsersComponent,
    pathMatch: 'full',
  },
  {
    path: 'not-found', loadChildren: './not-found/not-found.module#NotFoundModule',
    pathMatch: 'full',
  },
  /**
  * for every request, other than the defined routes, redirect them to not-found page
  */
  { path: '**', redirectTo: '/not-found' },
];

/**
* for base routes, use forChild,
* whereas, for child routes, use forChild
*/
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
/**
* Export routing module to use it in app module
*/
export class AppRoutingModule { }
import { Component } from '@angular/core';

/**
* wrap selector, templateUrl and stylesheets URL
* in a single component
*/
@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})

/**
* @class NotFoundComponent
* this class provides a common not-found component
* whenever user tries to access some route,
* which is not listed in routing module, then
* use will get redirected to this component,
* indicating "page not found"
*/
export class NotFoundComponent { }

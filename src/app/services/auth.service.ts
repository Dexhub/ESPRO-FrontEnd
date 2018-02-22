import { Injectable } from '@angular/core';
import { Headers } from '@angular/http';

/**
* @class AuthService
* This class provides auth service,
* to navigate on login route, if user is not logged in
*/
@Injectable()
export class AuthService {

  /**
  * return header with access token
  */
  getHeaders() {
    /**
    * initialize headers object
    */
    const headers: Headers = new Headers();

    /**
    * append access token and content type in headers
    */
    headers.append('Content-Type', 'application/json');
    /**
    * return headers
    */
    return headers;
  }

}

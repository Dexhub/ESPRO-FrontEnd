import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { constants, apiUrl } from '../constants/constants';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class CommonService {
  public apiUrl: string = constants.API_URL;
  constructor(private http: Http, private router: Router, private authService: AuthService) {}

  updateQueryStringParameter(uri: string, key:string, value: string) {
    if (localStorage.getItem('isSuperAdmin')) {
      let re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
      let separator = uri.indexOf('?') !== -1 ? "&" : "?";
      if (uri.match(re)) {
        return uri.replace(re, '$1' + key + "=" + value + '$2');
      }
      else {
        return uri + separator + key + "=" + value;
      }
    } else {
      return uri;
    }
  }

  postMethod(data: object, url:string, userId = '', isSuperAdmin = false) {
    if (isSuperAdmin) {
      url = this.updateQueryStringParameter(url, 'userId', userId);
    }
    return new Promise((resolve, reject) => {
      const headers = this.authService.getHeaders();
      this.http.post(url, data, { headers: headers })
        .subscribe(
          (res: Response) => { resolve(res.json()); },
          (error) => { reject(error.json()); }
        );
    });
  }

  putMethod(data: object, url:string, userId = '', isSuperAdmin = false) {
    if (isSuperAdmin) {
      url = this.updateQueryStringParameter(url, 'userId', userId);
    }
    return new Promise((resolve, reject) => {
      const headers = this.authService.getHeaders();
      this.http.put(url, data, { headers: headers })
        .subscribe(
          (res: Response) => { resolve(res.json()); },
          (error) => { reject(error.json()); }
        );
    });
  }

  deleteMethod(url:string, userId = '', isSuperAdmin = false) {
    if (isSuperAdmin) {
      url = this.updateQueryStringParameter(url, 'userId', userId);
    }
    return new Promise((resolve, reject) => {
      const headers = this.authService.getHeaders();
      this.http.delete(url, { headers: headers })
        .subscribe(
          (res: Response) => { resolve(res.json()); },
          (error) => { reject(error.json()); }
        );
    });
  }

  getMethod(url:string, userId = '', isSuperAdmin = false) {
    if (isSuperAdmin) {
      url = this.updateQueryStringParameter(url, 'userId', userId);
    }
    return new Promise((resolve, reject) => {
      const headers = this.authService.getHeaders();
      this.http.get(url, { headers: headers })
        .subscribe(
          (res: Response) => { resolve(res.json()); },
          (error) => { reject(error.json()); }
        );
    });
  }

  getGdaxProducts() {
    return new Promise((resolve, reject) => {
      this.http.get('https://api.gdax.com/products')
        .subscribe(
          (res: Response) => { resolve(res.json()); },
          (error) => { reject(error.json()); }
        );
    });
  }
}

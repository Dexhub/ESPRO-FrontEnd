import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { constants, apiUrl } from '../constants/constants';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class CommonService {
  public apiUrl: string = constants.API_URL;
  constructor(private http: Http, private router: Router, private authService: AuthService) {}

  postMethod(data: object, url:string) {
    return new Promise((resolve, reject) => {
      const headers = this.authService.getHeaders();
      this.http.post(url, data, { headers: headers })
        .subscribe(
          (res: Response) => { resolve(res.json()); },
          (error) => { reject(error.json()); }
        );
    });
  }

  putMethod(data: object, url:string) {
    return new Promise((resolve, reject) => {
      const headers = this.authService.getHeaders();
      this.http.put(url, data, { headers: headers })
        .subscribe(
          (res: Response) => { resolve(res.json()); },
          (error) => { reject(error.json()); }
        );
    });
  }

  getMethod(url:string) {
    return new Promise((resolve, reject) => {
      const headers = this.authService.getHeaders();
      this.http.get(url, { headers: headers })
        .subscribe(
          (res: Response) => { resolve(res.json()); },
          (error) => { reject(error.json()); }
        );
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonService } from '../../services';
import { apiUrl } from '../../constants/constants';

export interface UserData {
  userId: number,
  name: string
}

export interface UserDataResponse {
  status: Boolean,
  info: {
    users: Array<UserData>
  }
}

@Component({
  selector: 'home-app',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  public form: FormGroup;
  public error:string = '';
  public addUser: Boolean = false;
  public users: Array<UserData> = [];

  constructor(public router: Router, public commonService: CommonService) {
    this.commonService.getMethod(apiUrl.user)
    .then((users:UserDataResponse) => {
      this.users = users.info.users;
    });
  }
}

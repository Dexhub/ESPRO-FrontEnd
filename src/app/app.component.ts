import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonService } from './services/common.service';
import { apiUrl } from './constants/constants';

export interface UserData {
  userId: number,
  name: string
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public form: FormGroup;
  public error:string = '';
  public addUser: Boolean = false;
  public users: Array<UserData> = [];

  constructor(public router: Router, public commonService: CommonService) {

  }
}

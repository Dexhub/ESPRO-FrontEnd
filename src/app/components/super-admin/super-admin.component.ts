import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonService, SocketService } from '../../services';
import { apiUrl } from '../../constants/constants';
import { AuthService, SocialUser, GoogleLoginProvider, FacebookLoginProvider } from 'angular4-social-login';
import { DataTablesModule } from 'angular-datatables';

@Component({
  selector: 'super-admin-app',
  templateUrl: './super-admin.component.html',
  styleUrls: ['./super-admin.component.scss']
})

export class SuperAdminComponent {
  public isLoggedIn: boolean = false;
  public error: string = '';
  public loginForm: FormGroup;
  public userList: any = [];
  public dtOptions: DataTables.Settings = {
     paging: true,
     pagingType: 'simple',
     autoWidth: true
   };
  constructor(public router: Router, public commonService: CommonService, public socketService: SocketService, private auth: AuthService) {
    this.resetForm();
    if (localStorage.getItem('token')) {
      this.getUserList();
    }
  }
  signOut() {
    localStorage.removeItem('token');
    localStorage.removeItem('isSuperAdmin');
    this.isLoggedIn = false;
  }
  ngOnInit() {
    this.socketService.disconnect();
    if (localStorage.getItem('token')) {
      this.isLoggedIn = true;
    }
  }

  resetForm() {
    this.loginForm = new FormGroup({
      username: new FormControl('', [
        Validators.required
      ]),
      password: new FormControl('', [
        Validators.required
      ])
    });
  }

  login(data: any) {
    this.commonService.postMethod(data, `${apiUrl.user}/superadmin/login`)
    .then((loginData: any) => {
      this.processLogin(loginData);
    })
    .catch((err) => {
      this.processError(err);
    });
  }

  processLogin(data:any) {
    this.isLoggedIn = true;
    this.error = '';
    if (data.status && data.info && data.info.token) {
      localStorage.setItem('token', data.info.token);
      localStorage.setItem('isSuperAdmin', 'true');
      this.resetForm();
      this.getUserList();
    } else {
      this.error = data.info.message;
    }
  }

  processError(error) {
    if (error.errormessage) {
      this.error = error.errormessage;
    }
  }

  getUserList() {
    this.error = '';
    this.commonService.getMethod(`${apiUrl.user}`)
    .then((res:any) => {
      if (res.status) {
        this.userList = res.info.users;
      }
    });
  }
}

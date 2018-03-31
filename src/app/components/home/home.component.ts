import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonService, SocketService } from '../../services';
import { apiUrl } from '../../constants/constants';
import { AuthService, SocialUser, GoogleLoginProvider, FacebookLoginProvider } from 'angular4-social-login';

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
  public user;
  public isLoading = true;
  public signUpForm: FormGroup;
  public loginForm: FormGroup;
  public error:string = '';
  public addUser: Boolean = false;
  public formTag = 'login';

  constructor(public router: Router, public commonService: CommonService, public socketService: SocketService, private auth: AuthService) {
    this.resetForm();
  }

  ngOnInit() {
    this.socketService.disconnect();
    this.auth.authState.subscribe((user) => {
      if (user) {
        this.isLoading = true;
        if (!localStorage.getItem('token')) {
          this.socialLogin(user);
        } else {
          this.getMyProfile();
        }
      } else if (localStorage.getItem('token')) {
        this.getMyProfile();
      } else {
        this.isLoading = false;
      }
    });
  }

  getMyProfile() {
    this.commonService.getMethod(`${apiUrl.user}/profile`)
    .then((profileData: any) => {
      this.isLoading = false;
      if (profileData.status && profileData.info && profileData.info.user) {
        this.user = {
          name: profileData.info.user.name,
          email: profileData.info.user.email,
          contact: profileData.info.user.contact,
        };
      }
    }).catch((err) => {
      if (err.errormessage) {
        this.error = err.errormessage;
      }
    });
  }

  socialLogin(user) {
    this.commonService.postMethod({ authToken: user.authToken, provider: user.provider }, `${apiUrl.user}/login/social`)
    .then((loginData: any) => {
      this.isLoading = false;
      if (loginData.status && loginData.info && loginData.info.token) {
        localStorage.setItem('token', loginData.info.token);
        this.user = {
          name: loginData.info.name,
          email: loginData.info.email,
          contact: loginData.info.contact,
        };
      }
    });
  }

  signInWithGoogle(): void {
    this.auth.signIn(GoogleLoginProvider.PROVIDER_ID);
  }
  signInWithFacebook(): void {
    this.auth.signIn(FacebookLoginProvider.PROVIDER_ID);
  }
  signOut(): void {
   localStorage.removeItem('token');
   this.user = null;
   try {
     this.auth.signOut();
   } catch(e) {}
  }
  resetForm() {
    this.signUpForm = new FormGroup({
      username: new FormControl('', [
        Validators.required
      ]),
      email: new FormControl('', [
        Validators.required,
        Validators.email
      ]),
      password: new FormControl('', [
        Validators.required
      ]),
      contact: new FormControl('', [
        Validators.required,
        Validators.pattern(/^(\+\d{1,3}[- ]?)?\d{10}$/)
      ])
    });
    this.loginForm = new FormGroup({
      username: new FormControl('', [
        Validators.required
      ]),
      password: new FormControl('', [
        Validators.required
      ]),
    });
  }
  signUp(data:any) {
    this.commonService.postMethod(data, `${apiUrl.user}/signup`)
    .then((signUpdata: any) => {
      if (signUpdata.status && signUpdata.info && signUpdata.info.token) {
        localStorage.setItem('token', signUpdata.info.token);
        this.user = {
          name: signUpdata.info.name,
          email: signUpdata.info.email,
          contact: signUpdata.info.name,
        };
      }
    })
    .catch((err) => {
      if (err.errormessage) {
        this.error = err.errormessage;
      }
    });
  }
  login(data: any) {
    this.commonService.postMethod(data, `${apiUrl.user}/login`)
    .then((loginData: any) => {
      if (loginData.status && loginData.info && loginData.info.token) {
        localStorage.setItem('token', loginData.info.token);
        this.user = {
          name: loginData.info.name,
          email: loginData.info.email,
          contact: loginData.info.contact,
        };
      }
    })
    .catch((err) => {
      if (err.errormessage) {
        this.error = err.errormessage;
      }
    });
  }
}

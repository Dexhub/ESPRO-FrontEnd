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
  public isLoggedInFromProvider;
  public isLoading = true;
  public signUpForm: FormGroup;
  public loginForm: FormGroup;
  public editProfileForm: FormGroup;
  public forgetPasswordForm: FormGroup;
  public resetPasswordForm: FormGroup;
  public error:string = '';
  public message:string = '';
  public addUser: Boolean = false;
  public formTag = 'login';
  public editProfile = false;

  constructor(public router: Router, public commonService: CommonService, public socketService: SocketService, private auth: AuthService) {
    this.resetForm();
  }

  ngOnInit() {
    this.socketService.disconnect();
    this.auth.authState.subscribe((user) => {
      this.isLoggedInFromProvider = user;
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

  initiateEditProfileForm() {
    this.resetErrorSuccessMsg();
    this.editProfile = true;
    this.editProfileForm = new FormGroup({
      username: new FormControl(this.user.name, [
        Validators.required
      ]),
      email: new FormControl(this.user.email, [
        Validators.required,
        Validators.email
      ]),
      contact: new FormControl(this.user.contact, [
        Validators.pattern(/^(\+\d{1,3}[- ]?)?\d{10}$/)
      ])
    });
  }

  resetForgetPasswordForm() {
    this.resetErrorSuccessMsg();
    this.formTag = 'forgetPassword';
    this.forgetPasswordForm = new FormGroup({
      username: new FormControl('', [
        Validators.required
      ])
    });
    this.resetPasswordForm = new FormGroup({
      password: new FormControl('', [
        Validators.required
      ]),
      code: new FormControl('', [
        Validators.required
      ])
    });
  }


  forgetPassword(data) {
    this.resetErrorSuccessMsg();
    if (!this.forgetPasswordForm.controls.username.errors) {
      this.commonService.postMethod(data, `${apiUrl.user}/password/forget`)
      .then((success:any) => {
        this.resetForgetPasswordForm();
        this.formTag = 'resetPassword';
        this.message = success.info.message;
      })
      .catch((error) => {
        this.error = error.errormessage;
      });
    }
  }

  resetPassword(data) {
    this.resetErrorSuccessMsg();
    if (!this.resetPasswordForm.controls.password.errors && !this.resetPasswordForm.controls.code.errors) {
      this.commonService.postMethod(data, `${apiUrl.user}/password/reset`)
      .then((success:any) => {
        this.resetForgetPasswordForm();
        this.formTag = 'login';
        this.message = success.info.message;
      })
      .catch((error) => {
        this.error = error.errormessage;
      });
    }
  }

  changeFormTag(tag) {
    this.formTag = tag;
    this.resetErrorSuccessMsg();
  }

  resetErrorSuccessMsg() {
    this.message = '';
    this.error = '';
  }

  updateUserDetails(data:any) {
    this.resetErrorSuccessMsg();
    if (!this.editProfileForm.controls.username.errors && !this.editProfileForm.controls.email.errors && !this.editProfileForm.controls.contact.errors) {
      this.commonService.putMethod(data, `${apiUrl.user}/updateprofile`)
      .then((success:any) => {
        this.editProfile = false;
        this.user.username = data.username;
        this.user.email = data.email;
        this.user.contact = data.contact;
        this.message = success.info.message;
      })
      .catch((error) => {
        this.error = error.errormessage;
      });
    }
  }

  socialLogin(user) {
    this.resetErrorSuccessMsg();
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
   if (this.isLoggedInFromProvider) {
     this.auth.signOut();
   }
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
    this.resetErrorSuccessMsg();
    this.commonService.postMethod(data, `${apiUrl.user}/signup`)
    .then((signUpdata: any) => {
      if (signUpdata.status && signUpdata.info && signUpdata.info.token) {
        localStorage.setItem('token', signUpdata.info.token);
        this.user = {
          name: signUpdata.info.name,
          email: signUpdata.info.email,
          contact: signUpdata.info.name,
        };
        this.resetForm();
      }
    })
    .catch((err) => {
      if (err.errormessage) {
        this.error = err.errormessage;
      }
    });
  }
  login(data: any) {
    this.resetErrorSuccessMsg();
    this.commonService.postMethod(data, `${apiUrl.user}/login`)
    .then((loginData: any) => {
      if (loginData.status && loginData.info && loginData.info.token) {
        localStorage.setItem('token', loginData.info.token);
        this.user = {
          name: loginData.info.name,
          email: loginData.info.email,
          contact: loginData.info.contact,
        };
        this.resetForm();
      }
    })
    .catch((err) => {
      if (err.errormessage) {
        this.error = err.errormessage;
      }
    });
  }
}

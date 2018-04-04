import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonService, SocketService } from '../../services';
import { apiUrl } from '../../constants/constants';
import { AuthService, SocialUser, GoogleLoginProvider, FacebookLoginProvider } from 'angular4-social-login';
import * as _ from 'lodash';
import * as moment from 'moment';

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
    this.getCoinsList();
    this.getMySubscriptions();
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

  initiateEditProfileForm() {
    this.resetErrorSuccessMsg();
    this.formTag = 'editProfile';
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

  changeFormTag(tag) {
    this.formTag = tag;
    this.resetErrorSuccessMsg();
  }

  resetErrorSuccessMsg() {
    this.message = '';
    this.error = '';
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
          isEmailVerified: profileData.info.user.isEmailVerified,
          isContactVerified: profileData.info.user.isContactVerified,
          is2FAEnabled: profileData.info.user.is2FAEnabled,
        };
      }
    }).catch((err) => {
      this.processError(err);
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

  updateUserDetails(data:any) {
    this.resetErrorSuccessMsg();
    if (!this.editProfileForm.controls.username.errors && !this.editProfileForm.controls.email.errors && !this.editProfileForm.controls.contact.errors) {
      this.commonService.putMethod(data, `${apiUrl.user}/updateprofile`)
      .then((success:any) => {
        this.editProfile = false;
        this.message = success.info.message;
        this.user.username = data.username;
        this.user.email = data.email;
        this.user.contact = data.contact;
        this.user.isEmailVerified = success.info.isEmailVerified;
        this.user.isContactVerified = success.info.isContactVerified;
        this.user.is2FAEnabled = success.info.is2FAEnabled;
        localStorage.setItem('is2FAEnabled', success.info.is2FAEnabled);
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
      this.processLogin(loginData);
    });
  }

  signInWithGoogle() {
    this.resetErrorSuccessMsg();
    this.auth.signIn(GoogleLoginProvider.PROVIDER_ID);
  }
  signInWithFacebook() {
    this.resetErrorSuccessMsg();
    this.auth.signIn(FacebookLoginProvider.PROVIDER_ID);
  }
  signOut(): void {
   this.resetErrorSuccessMsg();
   localStorage.removeItem('token');
   localStorage.removeItem('is2FAEnabled');
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
      code: new FormControl(''),
    });
  }
  signUp(data:any) {
    this.resetErrorSuccessMsg();
    this.commonService.postMethod(data, `${apiUrl.user}/signup`)
    .then((signUpdata: any) => {
      this.processLogin(signUpdata);
    })
    .catch((err) => {
      this.processError(err);
    });
  }

  requestVerificationLink(verificationType) {
    this.resetErrorSuccessMsg();
    this.commonService.getMethod(`${apiUrl.user}/verificationlink?verificationType=${verificationType}`)
    .then((verificationData: any) => {
      if (verificationData.status) {
        this.message = verificationData.info.message;
      } else {
        this.error = verificationData.errormessage;
      }
    })
    .catch((err) => {
      this.processError(err);
    });
  }

  login(data: any) {
    this.resetErrorSuccessMsg();
    this.commonService.postMethod(data, `${apiUrl.user}/login`)
    .then((loginData: any) => {
      this.processLogin(loginData);
    })
    .catch((err) => {
      this.processError(err);
    });
  }

  processLogin(data:any) {
    if (data.status && data.info && data.info.token) {
      localStorage.setItem('token', data.info.token);
      localStorage.setItem('is2FAEnabled', data.info.is2FAEnabled);
      this.user = {
        name: data.info.name,
        email: data.info.email,
        contact: data.info.contact,
        isEmailVerified: data.info.isEmailVerified,
        isContactVerified: data.info.isContactVerified,
        is2FAEnabled: data.info.is2FAEnabled
      };
      this.resetForm();
    } else {
      this.error = data.info.message;
    }
  }

  public qrCodeImage = '';
  public code = '';
  enable2FARequest() {
    this.resetErrorSuccessMsg();
    if (this.qrCodeImage === '') {
      this.commonService.getMethod(`${apiUrl.user}/qrcode`)
      .then((qrCodeData: any) => {
        if (qrCodeData.status) {
          this.qrCodeImage = qrCodeData.info.QRCode;
          this.formTag = 'enable2FA';
        } else {
          this.error = qrCodeData.errormessage;
        }
      })
      .catch((err) => {
        this.processError(err);
      });
    } else {
      this.formTag = 'enable2FA';
    }
  }

  enable2FA() {
    this.resetErrorSuccessMsg();
    this.commonService.getMethod(`${apiUrl.user}/2fa/enable?code=${this.code}`)
    .then((success: any) => {
      if (success.status) {
        this.message = success.info.message;
        this.user.is2FAEnabled = true;
        localStorage.setItem('is2FAEnabled', success.status);
        this.formTag = 'login';
      } else {
        this.error = success.errormessage;
      }
    })
    .catch((err) => {
      this.processError(err);
    });
  }

  processError(error) {
    if (error.errormessage) {
      this.error = error.errormessage;
    }
  }

  public subscriptionForm: FormGroup;
  public subscriptionUpdateForm: FormGroup;
  public subscriptionError: string = '';
  public subscriptionId: any = '';
  public subscriptionFormType: string = 'add';
  public subscriptions: any = [];
  public coinsList: any = [];
  public alertTypes: any = [
    { key: 'percentagePriceChange', value: 'Percentage price change' },
    { key: 'percentageVolumeChange', value: 'Percentage volume change' },
    { key: 'specificPrice', value: 'Specific price' },
    { key: 'percentagePortfolioChange', value: 'Percentage portfolio change' },
    { key: 'specificTime', value: 'Specific time' }
  ];
  showNotifications() {
    this.formTag = 'notifications';
    this.resetSubscriptionForm();
  }

  hideNotifications() {
    this.formTag = 'login';
  }

  resetSubscriptionForm() {
    this.subscriptionForm = new FormGroup({
      coinTicker: new FormControl('', [
        Validators.required
      ]),
      alertType: new FormControl('', [
        Validators.required
      ]),
      changeValue: new FormControl('', [
        Validators.required
      ]),
      changeTime: new FormControl('', [
        Validators.pattern(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
      ])
    });
    this.subscriptionUpdateForm = new FormGroup({
      subscriptionId: new FormControl('', [
        Validators.required
      ]),
      coinTicker: new FormControl('', [
        Validators.required
      ]),
      alertType: new FormControl('', [
        Validators.required
      ]),
      changeValue: new FormControl('', [
        Validators.required
      ]),
      changeTime: new FormControl('')
    });
  }

  getCoinsList() {
    this.commonService.getMethod(`${apiUrl.coinsid}`)
    .then((res:any) => {
      if (res.status) {
        this.coinsList = res.info.coins;
        this.coinsList = _.orderBy(this.coinsList, ['symbol'], ['asc']);
      }
    });
  }

  validateSubscriptionData(data:any) {
    this.subscriptionError = '';
    if (data.coinTicker === '') {
      this.subscriptionError = 'please select coin';
      return false;
    } else if (data.alertType === '') {
      this.subscriptionError = 'please select alert type';
      return false;
    } else if (data.alertType !== 'specificTime' && (data.changeValue === '' || isNaN(data.changeValue))) {
      this.subscriptionError = 'please provide a valid change value';
      return false;
    } else {
      if (data.alertType === 'specificTime') {
        const offset = new Date().getTimezoneOffset();
        const newDate = this.addMinutes(new Date(`${moment().format('YYYY-MM-DD')} ${data.changeTime}`), offset);
        console.log(newDate, data.changeTime, offset);
        let minutes = newDate.getMinutes();
        data.changeTime = `${newDate.getHours()}:${(minutes.toString().length === 1) ? '0' + minutes : minutes}`;
        data.changeValue = 0;
      }
      return data;
    }
  }

  setSubToUpdate() {
    const index = _.findIndex(this.subscriptions, (sub) => {
      return sub.id == this.subscriptionId;
    });
    this.subscriptionUpdateForm = new FormGroup({
      subscriptionId: new FormControl(this.subscriptions[index].id, [
        Validators.required
      ]),
      coinTicker: new FormControl(this.subscriptions[index].coinTicker, [
        Validators.required
      ]),
      alertType: new FormControl(this.subscriptions[index].alertType, [
        Validators.required
      ]),
      changeValue: new FormControl(this.subscriptions[index].changeValue, [
        Validators.required
      ]),
      changeTime: new FormControl(this.changeTimeToLocal(this.subscriptions[index].changeTime, this.subscriptions[index].alertType), [
        Validators.pattern(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
      ])
    });
  }

  onSubmitSubscriptionUpdate(data) {
    data = this.validateSubscriptionData(data);
    if (data) {
      this.commonService.putMethod(data, `${apiUrl.user}/subscribe/${data.subscriptionId}`)
      .then((res: any) => {
        if (res.status) {
          this.resetSubscriptionForm();
          const index = _.findIndex(this.subscriptions, (sub) => {
            return sub.id == data.subscriptionId;
          });
          this.subscriptions[index] = res.info.subscription;
          console.log(res.info.subscription, this.subscriptions[index])
        }
      })
      .catch((error) => {
        console.log('subscription error', error);
      });
    }
  }

  onSubmitSubscription(data:any) {
    data = this.validateSubscriptionData(data);
    if (data) {
      this.commonService.postMethod(data, `${apiUrl.user}/subscribe`)
      .then((res: any) => {
        console.log(res);
        this.resetSubscriptionForm();
        this.subscriptions.push(res.info.notification);
      })
      .catch((error) => {
        console.log('subscription error', error);
      });
    }
  }

  changeTimeToLocal(time, alertType) {
    if (alertType === 'specificTime') {
      const offset = new Date().getTimezoneOffset();
      const newDate = this.addMinutes(new Date(`${moment().format('YYYY-MM-DD')} ${time}`), -offset);
      let minutes = newDate.getMinutes();
      return `${newDate.getHours()}:${(minutes.toString().length === 1) ? '0' + minutes : minutes}`;
    }
  }

  addMinutes(date:any, minutes:any) {
    const date2 = new Date(date);
    date2.setMinutes(date2.getMinutes() + minutes);
    return date2;
  }

  changeSubscriptionFormTypeToUpdate() {
    this.subscriptionFormType = 'update';
  }

  changeSubscriptionFormTypeToAdd() {
    this.subscriptionFormType = 'add';
  }

  getMySubscriptions() {
    this.subscriptions = [];
    this.commonService.getMethod(`${apiUrl.user}/subscriptions`)
    .then((subscriptions: any) => {
      if (subscriptions.status) {
        this.subscriptions = subscriptions.info.subscriptions;
      }
    })
    .catch((error) => {
      console.log(error)
    });
  }
}

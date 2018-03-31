import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonService, SocketService } from '../../services';
import { apiUrl } from '../../constants/constants';
import { AuthService, SocialUser, GoogleLoginProvider, FacebookLoginProvider } from 'angular4-social-login';

@Component({
  selector: 'login-app',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
   user: SocialUser;
   constructor(private auth: AuthService) {
     console.log(auth, 'auth');
   }
   ngOnInit() {
    this.auth.authState.subscribe((user) => {
      this.user = user;
      console.log(user, 'user')
    });
   }

   signInWithGoogle(): void {
     this.auth.signIn(GoogleLoginProvider.PROVIDER_ID);
   }
   signInWithFacebook(): void {
     this.auth.signIn(FacebookLoginProvider.PROVIDER_ID);
   }
   signOut(): void {
    this.auth.signOut();
   }
}

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService as AuthServiceSocial, SocialLoginModule, AuthServiceConfig, GoogleLoginProvider, FacebookLoginProvider } from 'angular4-social-login';
import { AppComponent } from './app.component';
import { HomeComponent, UsersComponent, PublicDataComponent, CoinInfoComponent, LoginComponent } from './components';
import { CommonService, AuthService, SocketService } from './services';
import { AppRoutingModule } from './app-routing.module';
import { ChartsModule } from 'ng2-charts/ng2-charts';
import { DataTablesModule } from 'angular-datatables';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    UsersComponent,
    PublicDataComponent,
    CoinInfoComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    AppRoutingModule,
    ChartsModule,
    DataTablesModule,
    SocialLoginModule.initialize(new AuthServiceConfig([
      {
        id: GoogleLoginProvider.PROVIDER_ID,
        provider: new GoogleLoginProvider("946454775710-k4pupbc5igme5rbcr4lt6kkf4a9i4p6n.apps.googleusercontent.com")
      },
      {
        id: FacebookLoginProvider.PROVIDER_ID,
        provider: new FacebookLoginProvider("1330643750399864.apps.googleusercontent.com")
      }
    ]))
  ],
  providers: [CommonService, AuthService, SocketService, AuthServiceSocial],
  bootstrap: [AppComponent]
})
export class AppModule { }

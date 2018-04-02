import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService as AuthServiceSocial, SocialLoginModule } from 'angular4-social-login';
import { AppComponent } from './app.component';
import { HomeComponent, UsersComponent, PublicDataComponent, CoinInfoComponent, LoginComponent } from './components';
import { CommonService, AuthService, SocketService } from './services';
import { AppRoutingModule } from './app-routing.module';
import { ChartsModule } from 'ng2-charts/ng2-charts';
import { DataTablesModule } from 'angular-datatables';
import { authServiceConfig } from './constants/constants';

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
    SocialLoginModule.initialize(authServiceConfig)
  ],
  providers: [CommonService, AuthService, SocketService, AuthServiceSocial],
  bootstrap: [AppComponent]
})
export class AppModule { }

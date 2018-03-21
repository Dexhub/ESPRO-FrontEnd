import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { HomeComponent, UsersComponent, PublicDataComponent, CoinInfoComponent } from './components';
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
    CoinInfoComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    AppRoutingModule,
    ChartsModule,
    DataTablesModule
  ],
  providers: [CommonService, AuthService, SocketService],
  bootstrap: [AppComponent]
})
export class AppModule { }

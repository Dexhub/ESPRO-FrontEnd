import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonService } from '../../services';
import { apiUrl } from '../../constants/constants';
import { DataTablesModule } from 'angular-datatables';

@Component({
  selector: 'public-data-app',
  templateUrl: './public-data.component.html',
  styleUrls: ['./public-data.component.scss']
})
export class PublicDataComponent {
  public coinError:string = '';
  public coins: any = [];

  public error:string = '';
  public assets: any = [];
  public assetPairInput: string = 'BTC';

  public selectedExchange: string = 'bittrex';
  public exchanges: any = [];
  public exchangeCoinListError:string = '';
  public exchangeCoinList: any = [];

  public dtOptions: DataTables.Settings = {};

  constructor(public router: Router, public commonService: CommonService) {
    this.commonService.getMethod(`${apiUrl.user}/exchanges`)
    .then((data:any) => {
      this.exchanges = data.info.exchanges;
      this.getExchangeCoinList();
    });
    this.getCoins();
    this.getAssets();
    this.dtOptions = {
       paging: true,
       pagingType: 'simple',
       autoWidth: true
     };
  }

  getCoins() {
    this.coinError = '';
    this.coins = [];
    this.commonService.getMethod(`${apiUrl.coins}?limit=5000`)
    .then((data:any) => {
      if (data.status) {
        this.coins = data.info;
      } else {
        this.coinError = data.errormessage;
      }
    }).catch((error) => {
      this.coinError = error.errormessage;
    });
  }

  getAssets() {
    this.error = '';
    this.assets = [];
    this.commonService.getMethod(`${apiUrl.assetprice}?limit=5000&pair=${this.assetPairInput}`)
    .then((data:any) => {
      if (data.status) {
        this.assets = data.info;
      } else {
        this.error = data.errormessage;
      }
    }).catch((error) => {
      this.error = error.errormessage;
    });
  }

  getExchangeCoinList() {
    this.exchangeCoinListError = '';
    this.exchangeCoinList = [];
    this.commonService.getMethod(`${apiUrl.exchangecoinlist}?limit=5000&exchange=${this.selectedExchange}`)
    .then((data:any) => {
      if (data.status) {
        this.exchangeCoinList = data.info;
      } else {
        this.exchangeCoinListError = data.errormessage;
      }
    }).catch((error) => {
      this.exchangeCoinListError = error.errormessage;
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonService, SocketService } from '../../services';
import { Observable, Subject } from 'rxjs/Rx';
import { apiUrl } from '../../constants/constants';
import { DataTablesModule } from 'angular-datatables';
import * as _ from 'lodash';

@Component({
  selector: 'public-data-app',
  templateUrl: './public-data.component.html',
  styleUrls: ['./public-data.component.scss']
})
export class PublicDataComponent {
  public coinError:string = '';
  public coins: any = [];
  public uiCoins: any = { data: {}, keys: [] };
  public isLoggedIn: Boolean = false;

  public error:string = '';
  public assets: any = [];
  public assetPairInput: string = 'BTC';

  public selectedExchange: string = 'bittrex';
  public exchanges: any = [];
  public exchangeCoinListError:string = '';
  public exchangeCoinList: any = [];
  public socketData: any = {};
  public dtOptions: DataTables.Settings = {};
  public page:number = 0;
  public currentSort = 'rank';
  public currentOrder = 'asc';
  public currencies: any =  [ "FJD", "CZK", "NGN", "GBP", "SVC", "SYP", "CRC", "SBD", "BHD", "BDT", "LBP", "PAB", "PEN", "NAD", "XPF", "ERN", "RON", "SOS", "ANG", "YER", "BMD", "BYR", "CLP", "VUV", "BTN", "LYD", "MVR", "HNL", "USD", "TZS", "MXN", "GGP", "CLF", "JEP", "XAF", "TOP", "MWK", "PYG", "VEF", "XDR", "BAM", "MYR", "ETB", "HRK", "OMR", "THB", "XOF", "XAG", "CNY", "LRD", "ARS", "ISK", "KGS", "KMF", "LKR", "BBD", "IQD", "LTL", "IDR", "RSD", "BND", "HUF", "XAU", "DZD", "TWD", "JOD", "NOK", "EUR", "EGP", "JMD", "TRY", "MNT", "RUB", "SCR", "AED", "SRD", "COP", "MDL", "UYU", "ZAR", "MKD", "SEK", "GIP", "KRW", "MGA", "LVL", "ILS", "BSD", "PHP", "FKP", "TTD", "DKK", "LSL", "ZMK", "MRO", "BYN", "CUC", "CVE", "BTC", "ZWL", "NZD", "KWD", "LAK", "BGN", "MUR", "KZT", "MZN", "UZS", "TJS", "SAR", "CUP", "STD", "SLL", "GHS", "HKD", "PLN", "INR", "BOB", "CDF", "KPW", "GYD", "AUD", "DOP", "VND", "WST", "UGX", "QAR", "IRR", "CAD", "PGK", "KHR", "TND", "MOP", "BWP", "HTG", "XCD", "TMT", "DJF", "ZMW", "RWF", "ALL", "AZN", "KYD", "PKR", "SDG", "KES", "BZD", "AOA", "UAH", "MAD", "IMP", "AMD", "GMD", "MMK", "AFN", "JPY", "GNF", "CHF", "AWG", "NPR", "GEL", "SZL", "NIO", "BRL", "SHP", "BIF", "SGD", "GTQ"];
  public selectedCurrency = 'USD';
  public selectedAssetCurrency = 'USD';
  public sort:any = {
    'rank': 'asc',
    'priceInUsd': 'asc',
    'volume24Hour': 'asc',
    'marketCap': 'asc',
  };
  public pageNumbers:any = [];

  constructor(public router: Router, public commonService: CommonService, public socketService: SocketService) {
    if (localStorage.getItem('token')) {
      this.isLoggedIn = true;
    }
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

  ngOnInit() {
    /**
    * connection with server by socket connection
    */
    this.socketService.connect();
    this.socketData = <Subject<MessageEvent>>this.socketService.getMessage()
      .map((response: MessageEvent): MessageEvent => {
        return response;
      });

    /**
    * get socketData form server using socket connection
    */
    this.socketData.subscribe((msg: any) => {
      if (msg.type === 'coinChange' && this.method === 'coin') {
        const coinTicker = `${msg.data.symbol}-${msg.data.exchange}`;
        if (this.uiCoins.data[coinTicker] !== undefined) {
          this.uiCoins.data[coinTicker].priceClass = (this.uiCoins.data[coinTicker].price_usd > msg.data.price_usd) ? 'decrease' :  ((this.uiCoins.data[coinTicker].price_usd < msg.data.price_usd)) ? 'increase' : 'neutral';
          this.uiCoins.data[coinTicker].market_cap_usd = msg.data.market_cap_usd;
          this.uiCoins.data[coinTicker].price_btc = msg.data.price_btc;
          this.uiCoins.data[coinTicker].price_usd = msg.data.price_usd;
          this.uiCoins.data[coinTicker].rank = msg.data.rank;
          // console.log(coinTicker, msg.type, this.exchange, this.method);
        }
      }

      if (msg.type === 'coinChangeByExchange' && this.method === 'exchange' && (this.exchange === '' || this.exchange === msg.data.symbol.exchange)) {
        const coinTicker = `${msg.data.symbol}-${msg.data.exchange}`;
        if (this.uiCoins.data[coinTicker] !== undefined) {
          this.uiCoins.data[coinTicker].priceClass = (this.uiCoins.data[coinTicker].price_usd > msg.data.price_usd) ? 'decrease' :  ((this.uiCoins.data[coinTicker].price_usd < msg.data.price_usd)) ? 'increase' : 'neutral';
          this.uiCoins.data[coinTicker].market_cap_usd = msg.data.market_cap_usd;
          this.uiCoins.data[coinTicker].price_btc = msg.data.price_btc;
          this.uiCoins.data[coinTicker].price_usd = msg.data.price_usd;
          this.uiCoins.data[coinTicker].rank = msg.data.rank;
          // console.log(coinTicker, msg.type, this.exchange, this.method);
        }
      }
    });
  }

  public method: string = 'coin';
  public exchange: string = '';
  getCoins(sortKey = 'rank', sortOrder = 'asc', pageNum = 0) {
    this.currentSort = sortKey;
    this.currentOrder = sortOrder;
    this.sort[sortKey] = sortOrder;
    this.page = pageNum;
    this.coinError = '';
    this.coins = [];
    this.uiCoins = { data: {}, keys: [] };
    this.commonService.getMethod(`${apiUrl.coins}?limit=${this.socketService.pageSize}&page=${this.page}&sort=${sortKey}&sortId=${sortOrder}&clientId=${this.socketService.clientId}&currency=${this.selectedCurrency}&method=${this.method}&exchange=${this.exchange}`)
    .then((data:any) => {
      if (data.status) {
        this.getPageNumbers(data.pagination.total);
        this.coins = data.info;
        this.coins.forEach((coin) => {
          this.uiCoins.data[`${coin.symbol}-${coin.exchange}`] = coin;
          this.uiCoins.data[`${coin.symbol}-${coin.exchange}`].priceClass = 'neutral';
          this.uiCoins.keys.push(`${coin.symbol}-${coin.exchange}`);
        });
      } else {
        this.coinError = data.errormessage;
      }
    }).catch((error) => {
      this.coinError = error.errormessage;
    });
  }

  changeMethodType() {
    this.method = (this.method === 'coin') ? 'exchange' : 'coin';
    this.getCoins();
  }

  getPageNumbers(count) {
    this.pageNumbers = [];
    let pageSize = this.socketService.pageSize;
    for (let i = 0; i < Math.ceil(count / pageSize); i++) {
        this.pageNumbers.push(i);
    }
  }

  numberFormat(value:number) {
    if (value) {
      if (value % 1 === 0) {
        return value;
      } else {
        return value.toFixed(4);
      }
    } else {
      return value;
    }
  }

  getAssets() {
    this.error = '';
    this.assets = [];
    this.commonService.getMethod(`${apiUrl.assetprice}?limit=5000&pair=${this.assetPairInput}&currency=${this.selectedAssetCurrency}`)
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

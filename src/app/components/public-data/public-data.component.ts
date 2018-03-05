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
  public sort:any = {
    'rank': 'asc',
    'priceInUsd': 'asc',
    'volume24Hour': 'asc',
    'marketCap': 'asc',
  };
  public pageNumbers:any = [];

  constructor(public router: Router, public commonService: CommonService, public socketService: SocketService) {
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
      if (msg.type === 'coinChange') {
        const coinTicker = msg.data.symbol;
        if (this.uiCoins.data[coinTicker] !== undefined) {
          this.uiCoins.data[coinTicker].priceClass = (this.uiCoins.data[coinTicker].price_usd > msg.data.price_usd) ? 'decrease' :  ((this.uiCoins.data[coinTicker].price_usd < msg.data.price_usd)) ? 'increase' : 'neutral';
          this.uiCoins.data[coinTicker].market_cap_usd = msg.data.market_cap_usd;
          this.uiCoins.data[coinTicker].price_btc = msg.data.price_btc;
          this.uiCoins.data[coinTicker].price_usd = msg.data.price_usd;
          console.log(coinTicker, msg.data);
        }
      }
    });
  }

  getCoins(sortKey = 'rank', sortOrder = 'asc', pageNum = 0) {
    this.currentSort = sortKey;
    this.currentOrder = sortOrder;
    this.sort[sortKey] = sortOrder;
    this.page = pageNum;
    this.coinError = '';
    this.coins = [];
    this.uiCoins = { data: {}, keys: [] };
    this.commonService.getMethod(`${apiUrl.coins}?limit=${this.socketService.pageSize}&page=${this.page}&sort=${sortKey}&sortId=${sortOrder}&clientId=${this.socketService.clientId}`)
    .then((data:any) => {
      if (data.status) {
        this.getPageNumbers(data.pagination.total);
        this.coins = data.info;
        this.coins.forEach((coin) => {
          this.uiCoins.data[coin.symbol] = coin;
          this.uiCoins.data[coin.symbol].priceClass = 'neutral';
          this.uiCoins.keys.push(coin.symbol);
        });
      } else {
        this.coinError = data.errormessage;
      }
    }).catch((error) => {
      this.coinError = error.errormessage;
    });
  }

  getPageNumbers(count) {
    this.pageNumbers = [];
    let pageSize = this.socketService.pageSize;
    for (let i = 0; i < Math.ceil(count / pageSize); i++) {
        this.pageNumbers.push(i);
    }
  }

  numberFormat(value:number) {
    if (value % 1 === 0) {
      return value;
    } else {
      return value.toFixed(4);
    }
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

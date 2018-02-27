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

  public error:string = '';
  public assets: any = [];
  public assetPairInput: string = 'BTC';

  public selectedExchange: string = 'bittrex';
  public exchanges: any = [];
  public exchangeCoinListError:string = '';
  public exchangeCoinList: any = [];
  public socketData: any = {};
  public dtOptions: DataTables.Settings = {};

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
        const coinIndex = _.findIndex(this.coins, (coin) => coin.symbol === msg.data.symbol);
        if (coinIndex !== -1) {
          this.coins[coinIndex].available_supply = msg.data.available_supply;
          this.coins[coinIndex].currency = msg.data.currency;
          this.coins[coinIndex].market_cap_usd = msg.data.market_cap_usd;
          this.coins[coinIndex].percent_change_1h = msg.data.percent_change_1h;
          this.coins[coinIndex].percent_change_7d = msg.data.percent_change_7d;
          this.coins[coinIndex].percent_change_24h = msg.data.percent_change_24h;
          this.coins[coinIndex].price_btc = msg.data.price_btc;
          this.coins[coinIndex].price_usd = msg.data.price_usd;
          this.coins[coinIndex].rate = msg.data.rate;
          console.log(msg.data.symbol, msg.data.price_usd)
        }
      }
    });
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

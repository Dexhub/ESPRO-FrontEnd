import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { apiUrl } from '../../constants/constants';
import { CommonService, SocketService } from '../../services';

@Component({
  selector: 'trade-app',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss']
})


export class TradeComponent {
  public is2FAEnabled: boolean = false;
  public form: FormGroup;
  public portfolioRebalancingForm: FormGroup;
  public exchanges: any = {};
  public exchangeKeys: any = [];
  public gdaxIds: any = [];
  public error:string = '';
  public success:string = '';
  public portfolioRebalancing: Boolean = false;
  public myTrades: any = [];
   constructor(public router: Router, public commonService: CommonService, private route: ActivatedRoute, public socketService: SocketService) {
     this.getExchanges();
     this.resetForm();
     this.commonService.getGdaxProducts()
     .then((data) => {
       this.gdaxIds = data;
     })
     .catch((err) => {
       this.error = err;
     });
   }
   ngOnInit() {
    this.socketService.disconnect();
    const is2FAEnabled = localStorage.getItem('is2FAEnabled');
    this.is2FAEnabled = is2FAEnabled && is2FAEnabled.toString() === 'true' ? true : false;
    if (this.is2FAEnabled) {
      this.getMyTrades();
      this.getPortFolio();
    }
   }
   resetForm() {
     this.form = new FormGroup({
       userAccountId: new FormControl('', [ Validators.required ]),
       size: new FormControl('', [ Validators.required ]),
       price: new FormControl('', [ Validators.required ]),
       side: new FormControl('', [ Validators.required ]),
       productId: new FormControl('', [ Validators.required ]),
       type: new FormControl('', [ Validators.required ]),
       currency: new FormControl('', [ Validators.required ]),
       timeInForce: new FormControl('', [ Validators.required ])
     });
     this.portfolioRebalancingForm = new FormGroup({
       userAccountId: new FormControl('', [ Validators.required ]),
       baseSym: new FormControl('ETH', [ Validators.required ]),
       basePercentage: new FormControl('', [ Validators.required ]),
       quoteSym: new FormControl('USD', [ Validators.required ]),
       quotePercentage: new FormControl('', [ Validators.required ])
     });
   }
   getExchanges() {
     this.commonService.getMethod(`${apiUrl.user}/accountinfo`)
     .then((data:any) => {
       this.exchanges = data.info.userAccountInfo;
       const exchanges:any = {};
       this.exchanges.forEach((exchange:any) => {
         exchanges[exchange.userAccountId] = exchange;
       });
       this.exchanges = exchanges;
       this.exchangeKeys = Object.keys(exchanges);
     });
   }
   getMyTrades() {
     this.commonService.getMethod(`${apiUrl.portfolio}/trades`)
     .then((data:any) => {
       if (data.status) {
        this.myTrades = data.info.trades;
       } else {
        this.error = data.errormessage;
       }
     });
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

  public portfolio: any = [];
   getPortFolio() {
     this.portfolio = [];
     this.commonService.getMethod(`${apiUrl.portfolio}/fetch`)
     .then((res:any) => {
       if (res.status) {
          this.portfolio = res.info.percentageContribution;
       }
     })
     .catch((error) => {
       console.log(error);
       this.error = error.errormessage;
     });
   }
  jsonStringify(obj) {
    return JSON.stringify(obj, null, 1);
  }
   executeTrade(data) {
     const options = { body: {}, url: '' };
     const exchangeName = this.exchanges[data.userAccountId] ? this.exchanges[data.userAccountId].exchangeName : '';
     const userAccountId = this.exchanges[data.userAccountId] ? this.exchanges[data.userAccountId].userAccountId : '';
     if (exchangeName === 'gdax') {
       options.body = { size:data.size, price:data.price, side:data.side, productId:data.productId, type:data.type, userAccountId };
       options.url = 'gdax';
     } else if (exchangeName === 'coinbase') {
       options.body = { amount:data.size, currency:data.currency, side: data.side, userAccountId };
       options.url = 'coinbase';
     } else if (exchangeName === 'bittrex') {
       options.body = { quantity:data.size, market:data.currency, side: data.side, rate: data.price, userAccountId };
       options.url = 'bittrex';
     } else if (exchangeName === 'binance') {
       options.body = {
         quantity:data.size, type: data.type, symbol:data.currency, timeInForce: data.timeInForce,
         side: data.side, price: data.price, userAccountId
       };
       options.url = 'binance';
     }
     this.commonService.postMethod(options.body, `${apiUrl.trade}/${options.url}`)
     .then((success:any) => {
       this.resetForm();
       this.success = success.info.message;
       this.resetMsg();
     })
     .catch((err) => {
       this.error = err.errormessage;
       this.resetMsg();
     });
   }

  validatePortfolioRebalance(data:any) {
    if (data.baseSym !== 'ETH') {
      this.error = 'only ETH is allowed as base symbol';
      return false;
    } else if (data.quoteSym !== 'USD') {
      this.error = 'only USD is allowed as quote symbol';
      return false;
    } else if (isNaN(parseInt(data.basePercentage))) {
      this.error = 'please provide base percentage';
      return false;
    } else if (isNaN(parseInt(data.quotePercentage))) {
      this.error = 'please provide quote percentage';
      return false;
    } else if (parseInt(data.basePercentage) + parseInt(data.quotePercentage) !== 100) {
      this.error = 'sum of base percentage and quote percentage should be 100';
      return false;
    }
    return true;
  }

  executePortfolioRebalancing(data) {
    this.error = '';
    if (this.validatePortfolioRebalance(data)) {
      this.commonService.postMethod(data, `${apiUrl.portfolio}/rebalance`)
      .then((success:any) => {
        // this.resetForm();
        this.success = success.info.message;
        this.resetMsg();
      })
      .catch((err) => {
        this.error = err.errormessage;
        this.resetMsg();
      });
    }
  }

   resetMsg() {
     setTimeout(() => {
       this.success = '';
       this.error = '';
     }, 5000);
   }
}

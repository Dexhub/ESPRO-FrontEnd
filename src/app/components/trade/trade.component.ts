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
  public exchanges: any = {};
  public exchangeKeys: any = [];
  public gdaxIds: any = [];
  public error:string = '';
  public success:string = '';
   constructor(public router: Router, public commonService: CommonService, private route: ActivatedRoute, public socketService: SocketService) {
     this.getExchanges();
     this.resetForm();
     this.commonService.getGdaxProducts()
     .then((data) => {
       this.gdaxIds = data;
     })
     .catch((err) => {
       this.error = err;
     })
   }
   ngOnInit() {
    this.socketService.disconnect();
    const is2FAEnabled = localStorage.getItem('is2FAEnabled');
    this.is2FAEnabled = is2FAEnabled && is2FAEnabled.toString() === 'true' ? true : false;
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
   resetMsg() {
     setTimeout(() => {
       this.success = '';
       this.error = '';
     }, 5000);
   }
}

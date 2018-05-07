import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonService, SocketService } from '../../services';
import { apiUrl } from '../../constants/constants';
import { DataTablesModule } from 'angular-datatables';
import { Observable, Subject } from 'rxjs/Rx';
import * as _ from 'lodash';
import * as moment from 'moment';

export interface UserInfoData {
  userId: number;
  apiKey: string,
  secret: string,
  passPhrase: string,
  exchangeId: number,
  accountName: string
}

export interface Exchange {
  exchangeName: string,
  exchangeId: number
}

export interface UserAccount {
  userAccountId: number,
  accountName: string,
  exchangeName: string,
  exchangeId: number,
  apiKey: string,
  secret: string,
  passPhrase: string
}

export interface TradeObj {
  tradeId: string,
	orderId: string,
	symbolPair: string,
	tradePrice: number,
	tradeSize: number,
	tradeFee: number,
	tradeType: string,
	tradeSettled: Boolean,
	timestamp: Date,
	exchangeName: string,
}

export interface AggregateAmount {
  amount: number,
  priceInUsdTradeTime: number,
  coin: string,
  coinId: number,
  priceInUsd: number,
  change24Hour: number,
  value: number,
  valuePercentage: number,
  ROI: number,
}

@Component({
  selector: 'users-root',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent {
  public form: FormGroup;
  public error:string = '';
  public userIdError:string = '';
  public addUser: Boolean = false;
  public exchanges: Array<Exchange> = [];
  public userAccounts: Array<UserAccount> = [];
  public balanceSync: { [key: string]: Boolean } = {};
  public tradesSync: { [key: string]: Boolean } = {};
  public trades:Array<TradeObj> = [];
  public aggregateAmount:Array<AggregateAmount> = [];
  public aggregateAmountObj:any = { data: {}, keys: [] };
  public portfolio:any = {};
  public pageNumbers: any = [];
  public socketData: any = {};
  public totalPortFolio = 0;
  public userId: number = 0;
  public isSuperAdmin: boolean = false;
  public dtOptions: DataTables.Settings = {
     paging: true,
     pagingType: 'simple',
     autoWidth: true
   };
  public backUrl: string = '/users';
  constructor(public router: Router, public commonService: CommonService, private route: ActivatedRoute, public socketService: SocketService) {
    this.resetForm();
    this.route.params.subscribe(params => {
      if (params.id) {
        this.userId = params.id;
      }
    });
    if (localStorage.getItem('isSuperAdmin')) {
     this.isSuperAdmin = true;
      if (this.router.url == '/privatedata') {
        this.router.navigate([`/super-admin`]);
      }
      this.backUrl = `/users/${this.userId}`;
    }
    this.commonService.getMethod(`${apiUrl.user}/exchanges`, this.userId.toString(), this.isSuperAdmin)
    .then((data:{ status: Boolean, info: { exchanges: Array<Exchange> } }) => {
      this.exchanges = data.info.exchanges;
    });
    this.route.params.subscribe(params => {
      this.commonService.getMethod(`${apiUrl.user}/accountinfo`, this.userId.toString(), this.isSuperAdmin)
      .then((data:{ status: Boolean, info: { userAccountInfo: Array<UserAccount> } }) => {
        this.userAccounts = data.info.userAccountInfo;
      })
      .catch((error) => {
        this.processError(error);
      });
      this.getTradesHistory();
      this.getAggregationAmount();
      this.getPortFolio();
    });
  }

  processError(error) {
    if (error.errormessage) {
      this.userIdError = error.errormessage;
    }
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
          let coinTicker = msg.data.symbol;
          if (this.aggregateAmountObj.data[coinTicker]) {
            this.aggregateAmountObj.data[coinTicker].priceClass = (this.aggregateAmountObj.data[coinTicker].priceInUsd > msg.data.price_usd) ? 'decrease' :  ((this.aggregateAmountObj.data[coinTicker].priceInUsd < msg.data.price_usd)) ? 'increase' : 'neutral';
            this.aggregateAmountObj.data[coinTicker].priceInUsd = msg.data.price_usd;
            this.aggregateAmountObj.data[coinTicker].value = this.aggregateAmountObj.data[coinTicker].amount * msg.data.price_usd;

            let totalAmount = 0;
            this.aggregateAmountObj.keys.forEach((key) => {
              if (this.aggregateAmountObj.data[key].value && !isNaN(this.aggregateAmountObj.data[key].value)) {
                totalAmount += this.aggregateAmountObj.data[key].value;
              }
            });

            this.aggregateAmountObj.keys.forEach((key) => {
              this.aggregateAmountObj.data[key].valuePercentage = (this.aggregateAmountObj.data[key].value * 100) / totalAmount;
              this.aggregateAmountObj.data[key].ROI = ((this.aggregateAmountObj.data[key].value - this.aggregateAmountObj.data[key].priceInUsdTradeTime) / this.aggregateAmountObj.data[key].priceInUsdTradeTime) * 100;
              if (this.aggregateAmountObj.data[key].amount < 0) {
                this.aggregateAmountObj.data[key].ROI = -this.aggregateAmountObj.data[key].ROI;
              }
            });
          }

          if (this.portfolio.percentageContributionObj && this.portfolio.percentageContributionObj.data[coinTicker]) {
            this.portfolio.percentageContributionObj.data[coinTicker].priceClass = (this.portfolio.percentageContributionObj.data[coinTicker].priceOfOneUnit > msg.data.price_usd) ? 'decrease' :  ((this.portfolio.percentageContributionObj.data[coinTicker].priceOfOneUnit < msg.data.price_usd)) ? 'increase' : 'neutral';
            this.portfolio.percentageContributionObj.data[coinTicker].priceOfOneUnit = msg.data.price_usd;
            this.portfolio.percentageContributionObj.data[coinTicker].totalBalanceInUsd = (msg.data.price_usd * this.portfolio.percentageContributionObj.data[coinTicker].totalUnits);
            let totalAmount = 0;
            this.portfolio.percentageContributionObj.keys.forEach((key) => {
              if (this.portfolio.percentageContributionObj.data[key].totalBalanceInUsd && !isNaN(this.portfolio.percentageContributionObj.data[key].totalBalanceInUsd)) {
                totalAmount += this.portfolio.percentageContributionObj.data[key].totalBalanceInUsd;
              }
            });

            if (totalAmount !== 0 && totalAmount !== null && !isNaN(totalAmount) && totalAmount !== Infinity) {
              this.portfolio.percentageContributionObj.keys.forEach((key) => {
                this.portfolio.percentageContributionObj.data[key].percentage = (this.portfolio.percentageContributionObj.data[key].totalBalanceInUsd * 100) / totalAmount;
              });
            }
            this.totalPortFolio = totalAmount;
          }
        }
      });
    }

    getPortFolio() {
      this.portfolio = { change1d: {}, percentageContribution: [], portfolioData: [], percentageContributionObj: { data: {}, keys: [] } };
      this.commonService.getMethod(`${apiUrl.portfolio}/fetch`, this.userId.toString(), this.isSuperAdmin)
      .then((res:any) => {
        this.portfolio = res.info;
        this.portfolio.percentageContributionObj = { data: {}, keys: [] };
        let temp:any = { data: [{ data: [], label: 'portfolio' }], label: [] };
        this.portfolio.portfolioData.forEach((obj) => {
          temp.label.push(new Date(obj.createdAt).toLocaleString());
          temp.data[0].data.push(obj.totalBalance);
        });
        this.portfolio.portfolioData = temp;
        let totalAmount = 0;
        this.portfolio.percentageContribution.forEach((obj) => {
          this.portfolio.percentageContributionObj.data[obj.coinTicker] = obj;
          totalAmount += this.portfolio.percentageContributionObj.data[obj.coinTicker].totalBalanceInUsd;
          this.portfolio.percentageContributionObj.data[obj.coinTicker].priceClass = 'neutral';
          this.portfolio.percentageContributionObj.keys.push(obj.coinTicker);
        });
        this.totalPortFolio = totalAmount;
      })
      .catch((error) => {
        this.processError(error);
      });
    }

    getAggregationAmount() {
      this.aggregateAmount = [];
      this.aggregateAmountObj = { data: {}, keys: [] };
      this.commonService.getMethod(`${apiUrl.trade}/amount`, this.userId.toString(), this.isSuperAdmin)
      .then((res: { success:Boolean, info: { coinTotalAmount: Array<AggregateAmount> } }) => {
        this.aggregateAmount = res.info.coinTotalAmount;
        this.aggregateAmount.forEach((obj) => {
          this.aggregateAmountObj.data[obj.coin] = obj;
          this.aggregateAmountObj.data[obj.coin].priceClass = 'neutral';
          this.aggregateAmountObj.keys.push(obj.coin);
        });
      })
      .catch((error) => {
        this.processError(error);
      });
    }


    resetForm() {
      this.form = new FormGroup({
        accountName: new FormControl('', [
          Validators.required
        ]),
        apiKey: new FormControl('', [
          Validators.required
        ]),
        secret: new FormControl('', [
          Validators.required
        ]),
        exchangeId: new FormControl('', [
          Validators.required
        ]),
        passPhrase: new FormControl('', [
          Validators.required
        ])
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

    returnLocalString(date) {
      return new Date(date).toLocaleString();
    }

    validateUserInfoData(data:UserInfoData) {
      if (data.accountName === undefined  || data.accountName === null || data.accountName.trim() === '') {
        this.error = 'please provide a valid account name';
      } else if (data.apiKey === undefined  || data.apiKey === null || data.apiKey.trim() === '') {
        this.error = 'please provide a valid access key';
      } else if (data.secret === undefined  || data.secret === null || data.secret.trim() === '') {
        this.error = 'please provide a valid secret key';
      } else if (data.exchangeId === undefined  || data.exchangeId === null || data.exchangeId.toString() === '') {
        this.error = 'please select a valid exchange';
      } else {
        this.error = '';
      }
    }

    onSubmit(data: UserInfoData) {
      this.validateUserInfoData(data);
      if (this.error === '') {
        this.commonService.postMethod(data, `${apiUrl.user}/authenticate`, this.userId.toString(), this.isSuperAdmin)
        .then((res: { success: Boolean, info: { userAccountId: number, exchangeName: string } }) => {
          this.userAccounts.unshift({
            accountName: data.accountName,
            exchangeName: res.info.exchangeName,
            userAccountId: res.info.userAccountId,
            exchangeId: data.exchangeId,
            apiKey: data.apiKey,
            secret: data.secret,
            passPhrase: data.passPhrase
          });
          this.resetForm();
        })
        .catch((error) => {
          this.processError(error);
        });
      }
    }

    syncBalance(exchangeId:number, userAccountId: number) {
      this.balanceSync[`${userAccountId}`] = true;
      this.commonService.postMethod({ userAccountId }, `${apiUrl.balance}/fetch`, this.userId.toString(), this.isSuperAdmin)
      .then((res: { success: Boolean, info: { message: string } }) => {
        this.balanceSync[`${userAccountId}`] = false;
      })
      .catch((error) => {
        console.log(error);
        this.error = error.errormessage;
        this.balanceSync[`${userAccountId}`] = false;
      });
    }

    syncTradeHistory(exchangeId:number, userAccountId: number) {
      this.tradesSync[`${userAccountId}`] = true;
      this.commonService.postMethod({ userAccountId }, `${apiUrl.trade}/fetch`, this.userId.toString(), this.isSuperAdmin)
      .then((res: { success: Boolean, info: { message: string } }) => {
        this.tradesSync[`${userAccountId}`] = false;
      })
      .catch((error) => {
        this.processError(error);
      });
    }

    getTradesHistory() {
      this.trades = [];
      this.commonService.getMethod(`${apiUrl.trade}/fetch?limit=5000`, this.userId.toString(), this.isSuperAdmin)
      .then((res: { success:Boolean, info: { trades: Array<TradeObj> } }) => {
        this.trades = res.info.trades;
      })
      .catch((error) => {
        this.processError(error);
      });
    }
}

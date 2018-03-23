import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonService, SocketService } from '../../services';
import { apiUrl } from '../../constants/constants';
import { DataTablesModule } from 'angular-datatables';
import { Observable, Subject } from 'rxjs/Rx';
import * as _ from 'lodash';

export interface UserInfoData {
  userId: number;
  apiKey: string,
  secret: string,
  passPhrase: string,
  exchangeId: number
}

export interface Exchange {
  exchangeName: string,
  exchangeId: number
}

export interface UserAccount {
  userAccountId: number,
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
  public subscriptionForm: FormGroup;
  public subscriptionUpdateForm: FormGroup;
  public error:string = '';
  public userIdError:string = '';
  public userId:number;
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
  public coinsList: any = [];
  public subscriptionFormType: string = 'add';
  public alertTypes: any = [
    { key: 'percentagePriceChange', value: 'Percentage price change' },
		{ key: 'percentageVolumeChange', value: 'Percentage volume change' },
		{ key: 'specificPrice', value: 'Specific price' },
    // { key: 'percentagePortfolioChange', value: 'Percentage portfolio change' },
		// { key: 'specificTime', value: 'Specific time' }
  ];
  public dtOptions: DataTables.Settings = {
     paging: true,
     pagingType: 'simple',
     autoWidth: true
   };
  public subscriptions: any = [];
  constructor(public router: Router, public commonService: CommonService, private route: ActivatedRoute, public socketService: SocketService) {
    this.resetForm();
    this.resetSubscriptionForm();
    this.commonService.getMethod(`${apiUrl.user}/exchanges`)
    .then((data:{ status: Boolean, info: { exchanges: Array<Exchange> } }) => {
      this.exchanges = data.info.exchanges;
    });
    this.route.params.subscribe(params => {
      this.userId = params.id;
      this.commonService.postMethod({ username: this.userId }, `${apiUrl.user}/login`)
      .then((userData: { success: Boolean, info: { user: { userId: number } } }) => {
        this.userId = userData.info.user.userId;
        this.commonService.getMethod(`${apiUrl.user}/${this.userId}/account`)
        .then((data:{ status: Boolean, info: { userAccountInfo: Array<UserAccount> } }) => {
          this.userAccounts = data.info.userAccountInfo;
        });
        this.getTradesHistory();
        this.getAggregationAmount();
        this.getPortFolio();
        this.getCoinsList();
        this.getMySubscriptions();
      }).catch((error) => {
        this.userIdError = error.errormessage;
      });
    });
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
          }
        }
      });
    }

    getCoinsList() {
      this.commonService.getMethod(`${apiUrl.coinsid}`)
      .then((res:any) => {
        if (res.status) {
          this.coinsList = res.info.coins;
        }
      });
    }

    getPortFolio() {
      this.portfolio = { change1d: {}, percentageContribution: [], portfolioData: [], percentageContributionObj: { data: {}, keys: [] } };
      this.commonService.getMethod(`${apiUrl.portfolio}/fetch?userId=${this.userId}`)
      .then((res:any) => {
        this.portfolio = res.info;
        this.portfolio.percentageContributionObj = { data: {}, keys: [] };
        let temp:any = { data: [{ data: [], label: 'portfolio' }], label: [] };
        this.portfolio.portfolioData.forEach((obj) => {
          temp.label.push(new Date(obj.createdAt).toLocaleString());
          temp.data[0].data.push(obj.totalBalance);
        });
        this.portfolio.portfolioData = temp;
        this.portfolio.percentageContribution.forEach((obj) => {
          this.portfolio.percentageContributionObj.data[obj.coinTicker] = obj;
          this.portfolio.percentageContributionObj.data[obj.coinTicker].priceClass = 'neutral';
          this.portfolio.percentageContributionObj.keys.push(obj.coinTicker);
        });
        console.log(this.portfolio.portfolioData)
      })
      .catch((error) => {
        console.log(error);
      });
    }

    getAggregationAmount() {
      this.aggregateAmount = [];
      this.aggregateAmountObj = { data: {}, keys: [] };
      this.commonService.getMethod(`${apiUrl.trade}/amount?userId=${this.userId}`)
      .then((res: { success:Boolean, info: { coinTotalAmount: Array<AggregateAmount> } }) => {
        this.aggregateAmount = res.info.coinTotalAmount;
        this.aggregateAmount.forEach((obj) => {
          this.aggregateAmountObj.data[obj.coin] = obj;
          this.aggregateAmountObj.data[obj.coin].priceClass = 'neutral';
          this.aggregateAmountObj.keys.push(obj.coin);
        });
      })
      .catch((error) => {
        console.log(error);
      });
    }


  resetForm() {
    this.form = new FormGroup({
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

  public subscriptionError: string = '';
  resetSubscriptionForm() {
    this.subscriptionForm = new FormGroup({
      coinTicker: new FormControl('', [
        Validators.required
      ]),
      alertType: new FormControl('', [
        Validators.required
      ]),
      changeValue: new FormControl('', [
        Validators.required
      ])
    });

    this.subscriptionUpdateForm = new FormGroup({
      subscriptionId: new FormControl('', [
        Validators.required
      ]),
      coinTicker: new FormControl('', [
        Validators.required
      ]),
      alertType: new FormControl('', [
        Validators.required
      ]),
      changeValue: new FormControl('', [
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
    if (data.apiKey === undefined  || data.apiKey === null || data.apiKey.trim() === '') {
      this.error = 'please provide a valid access key';
    } else if (data.secret === undefined  || data.secret === null || data.secret.trim() === '') {
      this.error = 'please provide a valid access key';
    } else if (data.exchangeId === undefined  || data.exchangeId === null || data.exchangeId.toString() === '') {
      this.error = 'please select a valid exchange';
    } else {
      this.error = '';
    }
  }

  validateSubscriptionData(data:any) {
    this.subscriptionError = '';
    if (data.coinTicker === '') {
      this.subscriptionError = 'please select coin';
      return false;
    } else if (data.alertType === '') {
      this.subscriptionError = 'please select alert type';
      return false;
    } else if (data.changeValue === '' || isNaN(data.changeValue)) {
      this.subscriptionError = 'please provide a valid change value';
      return false;
    }
    return true;
  }

  onSubmit(data: UserInfoData) {
    this.validateUserInfoData(data);
    if (this.error === '') {
      data.userId = this.userId;
      this.commonService.postMethod(data, `${apiUrl.user}/authenticate`)
      .then((res: { success: Boolean, info: { userAccountId: number } }) => {
        this.userAccounts.unshift({
          userAccountId: res.info.userAccountId,
          exchangeId: data.exchangeId,
          apiKey: data.apiKey,
          secret: data.secret,
          passPhrase: data.passPhrase,
          exchangeName: ''
        });
        this.resetForm();
      })
      .catch((error) => {
        this.error = error.errormessage;
      })
    }
  }

  public subscriptionId: any = '';
  setSubToUpdate() {
    const index = _.findIndex(this.subscriptions, (sub) => {
      return sub.id == this.subscriptionId;
    });
    this.subscriptionUpdateForm = new FormGroup({
      subscriptionId: new FormControl(this.subscriptions[index].id, [
        Validators.required
      ]),
      coinTicker: new FormControl(this.subscriptions[index].coinTicker, [
        Validators.required
      ]),
      alertType: new FormControl(this.subscriptions[index].alertType, [
        Validators.required
      ]),
      changeValue: new FormControl(this.subscriptions[index].changeValue, [
        Validators.required
      ])
    });
  }
  onSubmitSubscriptionUpdate(data) {
    console.log(data, 'update');
    if (this.validateSubscriptionData(data)) {
      data.userId = this.userId;
      this.commonService.putMethod(data, `${apiUrl.user}/subscribe/${data.subscriptionId}`)
      .then((res: any) => {
        if (res.status) {
          this.resetSubscriptionForm();
          const index = _.findIndex(this.subscriptions, (sub) => {
            return sub.id == data.subscriptionId;
          });
          this.subscriptions[index] = res.info.subscription;
        }
      })
      .catch((error) => {
        console.log('subscription error', error);
      });
    }
  }
  onSubmitSubscription(data:any) {
    if (this.validateSubscriptionData(data)) {
      data.userId = this.userId;
      this.commonService.postMethod(data, `${apiUrl.user}/subscribe`)
      .then((res: any) => {
        console.log(res);
        this.resetSubscriptionForm();
        this.subscriptions.push(res.info.subscription);
      })
      .catch((error) => {
        console.log('subscription error', error);
      });
    }
  }

  changeSubscriptionFormTypeToUpdate() {
    this.subscriptionFormType = 'update';
  }

  changeSubscriptionFormTypeToAdd() {
    this.subscriptionFormType = 'add';
  }

  getMySubscriptions() {
    this.commonService.getMethod(`${apiUrl.user}/subscriptions?userId=${this.userId}`)
    .then((subscriptions: any) => {
      if (subscriptions.status) {
        this.subscriptions = subscriptions.info.subscriptions;
      }
      console.log(this.subscriptions);
    })
    .catch((error) => {
      console.log(error)
    });
  }

  syncBalance(exchangeId:number) {
    this.balanceSync[`${exchangeId}`] = true;
    this.commonService.postMethod({ userId: this.userId, exchangeId }, `${apiUrl.balance}/fetch`)
    .then((res: { success: Boolean, info: { message: string } }) => {
      this.balanceSync[`${exchangeId}`] = false;
    })
    .catch((error) => {
      console.log(error);
      this.balanceSync[`${exchangeId}`] = false;
    });
  }

  syncTradeHistory(exchangeId:number) {
    this.tradesSync[`${exchangeId}`] = true;
    this.commonService.postMethod({ userId: this.userId, exchangeId }, `${apiUrl.trade}/fetch`)
    .then((res: { success: Boolean, info: { message: string } }) => {
      this.tradesSync[`${exchangeId}`] = false;
    })
    .catch((error) => {
      console.log(error);
      this.tradesSync[`${exchangeId}`] = false;
    });
  }

  getTradesHistory() {
    this.trades = [];
    this.commonService.getMethod(`${apiUrl.trade}/fetch?userId=${this.userId}&limit=5000`)
    .then((res: { success:Boolean, info: { trades: Array<TradeObj> } }) => {
      this.trades = res.info.trades;
    })
    .catch((error) => {
      console.log(error);
    });
  }
}

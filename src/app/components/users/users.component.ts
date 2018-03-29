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
  public user:any = {};
  public userForm:string = 'show';
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
  public totalPortFolio = 0;
  public alertTypes: any = [
    { key: 'percentagePriceChange', value: 'Percentage price change' },
		{ key: 'percentageVolumeChange', value: 'Percentage volume change' },
		{ key: 'specificPrice', value: 'Specific price' },
    { key: 'percentagePortfolioChange', value: 'Percentage portfolio change' },
		{ key: 'specificTime', value: 'Specific time' }
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
      .then((userData: any) => {
        this.userId = userData.info.user.userId;
        this.user = userData.info.user;
        console.log(this.user);
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

  updateUserDetails() {
    console.log(this.user, 'update user data');
    this.commonService.putMethod(this.user, `${apiUrl.user}/updateprofile/${this.userId}`)
    .then((data) => {
      console.log(data, 'data');
      this.userForm = 'show';
    })
    .catch((error) => {
      console.log(error, 'error in updating profile')
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
            this.totalPortFolio = totalAmount;
          }
        }
      });
    }

    getCoinsList() {
      this.commonService.getMethod(`${apiUrl.coinsid}`)
      .then((res:any) => {
        if (res.status) {
          this.coinsList = res.info.coins;
          this.coinsList = _.orderBy(this.coinsList, ['symbol'], ['asc']);
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
        ]),
        changeTime: new FormControl('', [
          Validators.pattern(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
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
        ]),
        changeTime: new FormControl('')
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
      } else if (data.alertType !== 'specificTime' && (data.changeValue === '' || isNaN(data.changeValue))) {
        this.subscriptionError = 'please provide a valid change value';
        return false;
      } else {
        if (data.alertType === 'specificTime') {
          const offset = new Date().getTimezoneOffset();
          const newDate = this.addMinutes(new Date(`${moment().format('YYYY-MM-DD')} ${data.changeTime}`), offset);
          console.log(newDate, data.changeTime, offset);
          let minutes = newDate.getMinutes();
          data.changeTime = `${newDate.getHours()}:${(minutes.toString().length === 1) ? '0' + minutes : minutes}`;
          data.changeValue = 0;
        }
        return data;
      }
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
      console.log(this.subscriptions[index]);
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
        ]),
        changeTime: new FormControl(this.changeTimeToLocal(this.subscriptions[index].changeTime, this.subscriptions[index].alertType), [
          Validators.pattern(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
        ])
      });
    }
    onSubmitSubscriptionUpdate(data) {
      data = this.validateSubscriptionData(data);
      console.log(data);
      if (data) {
        data.userId = this.userId;
        this.commonService.putMethod(data, `${apiUrl.user}/subscribe/${data.subscriptionId}`)
        .then((res: any) => {
          if (res.status) {
            this.resetSubscriptionForm();
            const index = _.findIndex(this.subscriptions, (sub) => {
              return sub.id == data.subscriptionId;
            });
            this.subscriptions[index] = res.info.subscription;
            console.log(res.info.subscription, this.subscriptions[index])
          }
        })
        .catch((error) => {
          console.log('subscription error', error);
        });
      }
    }
    onSubmitSubscription(data:any) {
      data = this.validateSubscriptionData(data);
      console.log(data);
      if (data) {
        data.userId = this.userId;
        this.commonService.postMethod(data, `${apiUrl.user}/subscribe`)
        .then((res: any) => {
          console.log(res);
          this.resetSubscriptionForm();
          this.subscriptions.push(res.info.notification);
        })
        .catch((error) => {
          console.log('subscription error', error);
        });
      }
    }

    changeTimeToLocal(time, alertType) {
      if (alertType === 'specificTime') {
        const offset = new Date().getTimezoneOffset();
        const newDate = this.addMinutes(new Date(`${moment().format('YYYY-MM-DD')} ${time}`), -offset);
        let minutes = newDate.getMinutes();
        return `${newDate.getHours()}:${(minutes.toString().length === 1) ? '0' + minutes : minutes}`;
      }
    }

    addMinutes(date:any, minutes:any) {
      const date2 = new Date(date);
      date2.setMinutes(date2.getMinutes() + minutes);
      return date2;
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

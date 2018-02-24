import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonService } from '../../services';
import { apiUrl } from '../../constants/constants';
import { DataTablesModule } from 'angular-datatables';

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
  public portfolio:any = {};
  public coinContributionPaginated: any = [];
  public pageNumbers: any = [];
  public temp = [{
    data: [1,2,3,4,5,6,7,8,9,20],
    label: 'portfolio'
  }];
  public dtOptions: DataTables.Settings = {
     paging: true,
     pagingType: 'simple',
     autoWidth: true
   };
  constructor(public router: Router, public commonService: CommonService, private route: ActivatedRoute) {
    this.resetForm();
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
      }).catch((error) => {
        this.userIdError = error.errormessage;
      });
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

  numberFormat(value:number) {
    return value.toFixed(2);
  }

  validateUserInfoData(data:UserInfoData) {
    if (data.apiKey === undefined  || data.apiKey === null || data.apiKey.trim() === '') {
      this.error = 'please provide a valid access key';
    } else if (data.secret === undefined  || data.secret === null || data.secret.trim() === '') {
      this.error = 'please provide a valid access key';
    } else if (data.passPhrase === undefined  || data.passPhrase === null || data.passPhrase.trim() === '') {
      this.error = 'please provide a valid password';
    } else if (data.exchangeId === undefined  || data.exchangeId === null || data.exchangeId.toString() === '') {
      this.error = 'please select a valid exchange';
    } else {
      this.error = '';
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
    this.commonService.getMethod(`${apiUrl.trade}/fetch?userId=${this.userId}`)
    .then((res: { success:Boolean, info: { trades: Array<TradeObj> } }) => {
      this.trades = res.info.trades;
    })
    .catch((error) => {
      console.log(error);
    });
  }

  getAggregationAmount() {
    this.aggregateAmount = [];
    this.commonService.getMethod(`${apiUrl.trade}/amount?userId=${this.userId}`)
    .then((res: { success:Boolean, info: { coinTotalAmount: Array<AggregateAmount> } }) => {
      this.aggregateAmount = res.info.coinTotalAmount;
    })
    .catch((error) => {
      console.log(error);
    });
  }

  getPortFolio() {
    this.portfolio = { change1d: {}, percentageContribution: [], portfolioData: [] };
    this.commonService.getMethod(`${apiUrl.portfolio}/fetch?userId=${this.userId}`)
    .then((res:any) => {
      this.portfolio = res.info;
      let temp:any = { data: [{ data: [], label: 'portfolio' }], label: [] };
      this.portfolio.portfolioData.forEach((obj) => {
        temp.label.push(new Date(obj.createdAt).toLocaleString());
        temp.data[0].data.push(obj.totalBalance);
      });
      this.portfolio.portfolioData = temp;
    })
    .catch((error) => {
      console.log(error);
    });
  }
}

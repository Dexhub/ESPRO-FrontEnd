import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonService, SocketService } from '../../services';
import { Observable, Subject } from 'rxjs/Rx';
import { apiUrl } from '../../constants/constants';
import { symbols } from './symbols';
import { DataTablesModule } from 'angular-datatables';
import * as _ from 'lodash';

@Component({
  selector: 'coin-info-app',
  templateUrl: './coin-info.component.html',
  styleUrls: ['./coin-info.component.scss']
})
export class CoinInfoComponent {
  public coinError:string = '';
  public coin: string = 'BTC';
  public days: number = 30;
  public interval: number = 60;
  public coinChartData: any = { data: [{ data: [], label: "coin price" }], label: [] };
  public coinData: any = {};
  public symbols: any = symbols;
  public dtOptions: DataTables.Settings = {};

  constructor(public router: Router, public commonService: CommonService, public socketService: SocketService) {
    this.getCoin();
  }


  getCoin() {
    this.coinChartData = { data: [{ data: [], label: "coin price" }], label: [] };
    this.coinData = {};
    if (this.coin !== "") {
      this.commonService.getMethod(`${apiUrl.coininfo}?coin=${this.coin}&fetchHistory=true&days=${this.days}&interval=${this.interval}`)
      .then((data:any) => {
        this.coinData = data.info[0];
        this.coinData.history.prices.forEach((price) => {
          const key = this.objKeys(price)[0];
          this.coinChartData.label.push(key);
          this.coinChartData.data[0].data.push(price[key]);
        });
      });
    }
  }

  objKeys(obj:object) {
    return Object.keys(obj);
  }

  timestamp(datetime) {
    return new Date(datetime).getTime();
  }

  toLocaleString(datetime) {
    return new Date(datetime).toLocaleString();
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

  ngOnInit() {
    this.socketService.disconnect();
  }
}

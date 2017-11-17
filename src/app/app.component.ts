import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import * as uuid from 'uuid';

export interface RoundDataSchema {
  roundId: number,
  initialAmount: number,
  deductedAmount: number,
  resultAmount: number
}

export interface RoeRoundDataSchema {
  roundsPerPage: number,
  pageNumbers: Array<number>,
  data: Array<RoundDataSchema>,
  tempRoundData: Array<RoundDataSchema>
}

export interface RoundDataOfRoeArraySchema {
  [key:string]: RoeRoundDataSchema
}
export interface RoundDataToShowSchema {
  [key:string]: {
    show: boolean
  }
}
export interface RoeDataSchema {
  roundId: string,
  walletAmount: number,
  betAmount: number,
  RTP: number,
  ROE: number,
  numberOfExperiments: number,
  serverCapacity: number,
  totalSpins: number,
  timeForOneServer: number
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public form: FormGroup;
  public roeData:Array<RoeDataSchema> = [];
  public roundData:RoundDataOfRoeArraySchema = {} as RoundDataOfRoeArraySchema;
  public roeCalculationRunning:boolean = false;
  public roundDataToShow:RoundDataToShowSchema = {} as RoundDataToShowSchema;
  public error:string = '';
  constructor(public router: Router) {
    this.form = new FormGroup({
      walletAmount: new FormControl(0),
      betAmount: new FormControl(0),
      RTP: new FormControl(0),
      numberOfExperiments: new FormControl(0),
      serverCapacity: new FormControl(0)
    });
  }

  changeBet() {
    this.form.controls['betAmount'].setValue(Math.floor(this.form.value.walletAmount / (100)));
  }
  clearResult() {
    this.roundData = {} as RoundDataOfRoeArraySchema;
    this.roeData = [];
  }

  changeRoeShowStatus(roundId:string) {
    this.roundDataToShow[roundId].show = !this.roundDataToShow[roundId].show;
  }

  paginateRoundData(roundId:string, pageNum:number) {
    this.roundData[roundId].tempRoundData = [];
    for (let i = pageNum * this.roundData[roundId].roundsPerPage; i < pageNum * this.roundData[roundId].roundsPerPage + this.roundData[roundId].roundsPerPage; i += 1) {
      if (this.roundData[roundId].data[i]) this.roundData[roundId].tempRoundData.push(this.roundData[roundId].data[i]);
    }
  }

  getPageNumbersOfRoundData(roundId:string) {
    this.roundData[roundId].pageNumbers = [];
    let roundsPerPage:number = (this.roundData[roundId].data.length > 1450) ? Math.ceil(this.roundData[roundId].data.length / 29) : 50;
    this.roundData[roundId].roundsPerPage = roundsPerPage;
    let maxPage:number = Math.ceil(this.roundData[roundId].data.length / roundsPerPage);
    for (let i = 0; i < maxPage; i += 1) {
      this.roundData[roundId].pageNumbers.push(i);
    }
  }

  onSubmit(data: {walletAmount:number,betAmount:number,RTP:number, numberOfExperiments:number,serverCapacity:number}) {
    if (data.walletAmount > 0 && data.betAmount > 0 && data.RTP > 0 && data.betAmount < data.walletAmount &&
        data.numberOfExperiments > 0 && data.serverCapacity > 0 &&
        data.RTP < 100 && parseInt(data.betAmount.toString()) >= parseInt((data.walletAmount/100).toString())) {
      let roundId:string = uuid();
      this.roundDataToShow[roundId] = { show: false };
      this.roundData[roundId] = { data: [], pageNumbers: [], roundsPerPage: 0, tempRoundData: [] };
      this.error = '';
      this.roeData.unshift(Object.assign({roundId}, data) as RoeDataSchema);
      this.roeCalculationRunning = true;
      let ROE = 0;
      let walletAmount = data.walletAmount;
      while(walletAmount > 0) {
        let tempRoundData:any = {initialAmount:walletAmount,deductedAmount:(data.betAmount * (1 - (data.RTP/100)))};
        walletAmount = walletAmount - (data.betAmount * (1 - (data.RTP/100)))
        tempRoundData.resultAmount = walletAmount;
        if (walletAmount >= 0) {
          ROE += 1;
          this.roundData[roundId].data.push(Object.assign({roundId: ROE}, tempRoundData));
        }
      }
      this.roeData[0].ROE = ROE;
      this.roeData[0].totalSpins = data.numberOfExperiments * ROE;
      this.roeData[0].timeForOneServer = this.roeData[0].totalSpins / (data.serverCapacity * 60);
      this.roeCalculationRunning = false;
      this.getPageNumbersOfRoundData(roundId);
      this.paginateRoundData(roundId, 0);
    } else {
      if (data.walletAmount <= 0) {
        this.error = 'wallet amount shoud be greater than 0';
      } else if (data.betAmount <= 0) {
        this.error = 'bet amount should be greater than 0';
      } else if (parseInt(data.betAmount.toString()) < parseInt((data.walletAmount/100).toString())) {
        this.error = 'bet amount can not be less than (walletAmount/100)';
      } else if (data.betAmount > data.walletAmount) {
        this.error = 'bet amount can not be greater than wallet amount';
      } else if (data.RTP <= 0  || data.RTP >= 100) {
        this.error = 'RTP value should be greater than 0 and less than 100';
      } else if (data.numberOfExperiments <= 0) {
        this.error = 'number of experiments shoud be greater than 0';
      } else if (data.serverCapacity <= 0) {
        this.error = 'Spins / Second for base server shoud be greater than 0';
      }
    }
  }
}

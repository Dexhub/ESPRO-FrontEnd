import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonService } from '../../services';
import { apiUrl } from '../../constants/constants';
import { DataTablesModule } from 'angular-datatables';

@Component({
  selector: 'public-data-app',
  templateUrl: './public-data.component.html',
  styleUrls: ['./public-data.component.scss']
})
export class PublicDataComponent {
  public coinError:string = '';
  public coins: any = [];
  public paginatedCoins: any = [];
  public pageNumbers: any = [];

  public error:string = '';
  public assetPageNumbers: any = [];
  public paginatedAssets: any = [];
  public assets: any = [];
  public assetPairInput: string = 'BTC';

  public selectedExchange: string = 'bittrex';
  public exchanges: any = [];
  public exchangeCoinListError:string = '';
  public exchangeCoinList: any = [];
  public exchangeCoinListPageNumbers: any = [];
  public paginatedExchangeCoinList: any = [];

  public dtOptions: DataTables.Settings = {};

  constructor(public router: Router, public commonService: CommonService) {
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

  getCoins() {
    this.coinError = '';
    this.coins = [];
    this.paginatedCoins = [];
    this.commonService.getMethod(`${apiUrl.coins}?limit=5000`)
    .then((data:any) => {
      if (data.status) {
        this.coins = data.info;
        this.getPageCounts(this.coins.length);
        this.getPage(0);
      } else {
        this.coinError = data.errormessage;
      }
    }).catch((error) => {
      this.coinError = error.errormessage;
    });
  }
  getPage(pageNum) {
    this.paginatedCoins = [];
    for (let i = pageNum * 50; i < (pageNum * 50) + 50; i += 1) {
      if (this.coins[i]) {
        this.paginatedCoins.push(this.coins[i]);
      }
    }
  }
  getPageCounts(records) {
    this.pageNumbers = [];
    for (let i = 0; i < Math.ceil((records) / 50); i += 1) {
      this.pageNumbers.push(i);
    }
  }

  getAssets() {
    this.error = '';
    this.assets = [];
    this.paginatedAssets = [];
    this.commonService.getMethod(`${apiUrl.assetprice}?limit=5000&pair=${this.assetPairInput}`)
    .then((data:any) => {
      if (data.status) {
        this.assets = data.info;
        this.getAssetPageCounts(this.assets.length);
        this.getAssetPage(0);
      } else {
        this.error = data.errormessage;
      }
    }).catch((error) => {
      this.error = error.errormessage;
    });
  }
  getAssetPage(pageNum) {
    this.paginatedAssets = [];
    for (let i = pageNum * 50; i < (pageNum * 50) + 50; i += 1) {
      if (this.assets[i]) {
        this.paginatedAssets.push(this.assets[i]);
      }
    }
  }
  getAssetPageCounts(records) {
    this.assetPageNumbers = [];
    for (let i = 0; i < Math.ceil((records) / 50); i += 1) {
      this.assetPageNumbers.push(i);
    }
  }

  getExchangeCoinList() {
    this.exchangeCoinListError = '';
    this.exchangeCoinList = [];
    this.paginatedExchangeCoinList = [];
    this.commonService.getMethod(`${apiUrl.exchangecoinlist}?limit=5000&exchange=${this.selectedExchange}`)
    .then((data:any) => {
      if (data.status) {
        this.exchangeCoinList = data.info;
        this.getExchangeCoinListPageCounts(this.exchangeCoinList.length);
        this.getExchangeCoinListPage(0);
      } else {
        this.exchangeCoinListError = data.errormessage;
      }
    }).catch((error) => {
      this.exchangeCoinListError = error.errormessage;
    });
  }
  getExchangeCoinListPage(pageNum) {
    this.paginatedExchangeCoinList = [];
    for (let i = pageNum * 50; i < (pageNum * 50) + 50; i += 1) {
      if (this.exchangeCoinList[i]) {
        this.paginatedExchangeCoinList.push(this.exchangeCoinList[i]);
      }
    }
  }
  getExchangeCoinListPageCounts(records) {
    this.exchangeCoinListPageNumbers = [];
    for (let i = 0; i < Math.ceil((records) / 50); i += 1) {
      this.exchangeCoinListPageNumbers.push(i);
    }
  }
}

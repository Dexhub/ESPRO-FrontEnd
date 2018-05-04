import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonService, SocketService } from '../../services';
import { Observable, Subject } from 'rxjs/Rx';
import { apiUrl } from '../../constants/constants';
import { DataTablesModule } from 'angular-datatables';

@Component({
  selector: 'kraken-app',
  templateUrl: './kraken.component.html',
  styleUrls: ['./kraken.component.scss']
})
export class KrakenComponent {
  public error:string = '';
  public isLoading:boolean = false;
  public krakenCoins: any = [];
  public coinType: string = 'coin';
  public krakenEth: any = [];
  public coinPages: any = [];
  public actualCoinPages: any = [];
  public ethPages: any = [];
  public coinCurrentPage: number = 0;
  public ethCurrentPage: number = 0;
  public coinLimit:number = 500;
  public ethLimit:number = 100;
  public dtOptions: DataTables.Settings = {};
  public pageCount: number = 20;
  public totalCoins: number = 0;
  public totalEth: number = 0;
  constructor(public router: Router, public commonService: CommonService, public socketService: SocketService) {
    this.getCoins(0, true, false);
    this.getEth(0, true);
  }


  getCoins(pageNum = 0, forceGet, getPages) {
    if (pageNum >= 0 && (forceGet || pageNum !== this.coinCurrentPage) && (!getPages || pageNum < this.coinPages.length - 1)) {
      this.coinCurrentPage = pageNum;
      this.isLoading = true;
      this.commonService.getMethod(`${apiUrl.krakenCoins}?limit=${this.coinLimit}&skip=${this.coinCurrentPage * this.coinLimit}`)
      .then((res:any) => {
        this.totalCoins = res.pagination.total;
        this.isLoading = false;
        if (res.status) {
          this.krakenCoins = res.info.coins;
          this.coinPages = this.getPagesByTotalCount(res.pagination.total, this.coinLimit);
          if (getPages) {
            this.actualCoinPages = this.getNextPages(pageNum, this.coinPages, this.pageCount);
          } else {
            this.actualCoinPages = this.getNextPages(this.actualCoinPages[0] || 0, this.coinPages, this.pageCount);
          }
        }
      })
      .catch((err) => {
        this.error = err.errormessage;
        this.isLoading = false;
      });
    }
  }

  getEth(pageNum = 0, forceGet) {
    if (forceGet || pageNum !== this.ethCurrentPage) {
      this.ethCurrentPage = pageNum;
      this.isLoading = true;
      this.commonService.getMethod(`${apiUrl.krakenEth}?limit=${this.ethLimit}&skip=${this.ethCurrentPage * this.ethLimit}`)
      .then((res:any) => {
        this.isLoading = false;
        if (res.status) {
          this.totalEth = res.pagination.total;
          this.krakenEth = res.info.ethereum;
          this.ethPages = this.getPagesByTotalCount(res.pagination.total, this.ethLimit);
        }
      })
      .catch((err) => {
        this.isLoading = false;
        this.error = err.errormessage;
      });
    }
  }

  getNextPages(fromPage, totalPages, count) {
    const pages = [];
    const start = fromPage;
    const lastPage = (fromPage + count <= totalPages.length) ? (fromPage + count) : totalPages.length;
    for (let i = start; i < lastPage; i++) {
      pages.push(totalPages[i]);
    }
    return pages;
  }

  getPagesByTotalCount(total, limit) {
    const pages = [];
    for (let i = 0; i < Math.ceil(total / limit); i++) {
        pages.push(i);
    }
    return pages;
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

import { TestBed, async } from '@angular/core/testing';

import { CoinInfoComponent } from './coinInfo.component';

describe('CoinInfoComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CoinInfoComponent
      ],
    }).compileComponents();
  }));

  it('should create the coinInfo', async(() => {
    const fixture = TestBed.createComponent(CoinInfoComponent);
    const coinInfo = fixture.debugElement.componentInstance;
    expect(coinInfo).toBeTruthy();
  }));

  it(`should have as title 'coinInfo works!'`, async(() => {
    const fixture = TestBed.createComponent(CoinInfoComponent);
    const coinInfo = fixture.debugElement.componentInstance;
    expect(coinInfo.title).toEqual('coinInfo works!');
  }));

  it('should render title in a h1 tag', async(() => {
    const fixture = TestBed.createComponent(CoinInfoComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('coinInfo works!');
  }));
});

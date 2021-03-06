import { TestBed, async } from '@angular/core/testing';

import { TradeComponent } from './trade.component';

describe('TradeComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TradeComponent
      ],
    }).compileComponents();
  }));

  it('should create the trade', async(() => {
    const fixture = TestBed.createComponent(TradeComponent);
    const trade = fixture.debugElement.componentInstance;
    expect(trade).toBeTruthy();
  }));

  it(`should have as title 'trade works!'`, async(() => {
    const fixture = TestBed.createComponent(TradeComponent);
    const trade = fixture.debugElement.componentInstance;
    expect(trade.title).toEqual('trade works!');
  }));

  it('should render title in a h1 tag', async(() => {
    const fixture = TestBed.createComponent(TradeComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('trade works!');
  }));
});

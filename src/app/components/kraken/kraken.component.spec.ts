import { TestBed, async } from '@angular/core/testing';

import { KrakenComponent } from './kraken.component';

describe('KrakenComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        KrakenComponent
      ],
    }).compileComponents();
  }));

  it('should create the kraken', async(() => {
    const fixture = TestBed.createComponent(KrakenComponent);
    const kraken = fixture.debugElement.componentInstance;
    expect(kraken).toBeTruthy();
  }));

  it(`should have as title 'kraken works!'`, async(() => {
    const fixture = TestBed.createComponent(KrakenComponent);
    const kraken = fixture.debugElement.componentInstance;
    expect(kraken.title).toEqual('kraken works!');
  }));

  it('should render title in a h1 tag', async(() => {
    const fixture = TestBed.createComponent(KrakenComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('kraken works!');
  }));
});

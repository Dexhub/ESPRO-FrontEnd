import { TestBed, async } from '@angular/core/testing';

import { PublicDataComponent } from './publicData.component';

describe('PublicDataComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        PublicDataComponent
      ],
    }).compileComponents();
  }));

  it('should create the publicData', async(() => {
    const fixture = TestBed.createComponent(PublicDataComponent);
    const publicData = fixture.debugElement.componentInstance;
    expect(publicData).toBeTruthy();
  }));

  it(`should have as title 'publicData works!'`, async(() => {
    const fixture = TestBed.createComponent(PublicDataComponent);
    const publicData = fixture.debugElement.componentInstance;
    expect(publicData.title).toEqual('publicData works!');
  }));

  it('should render title in a h1 tag', async(() => {
    const fixture = TestBed.createComponent(PublicDataComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('publicData works!');
  }));
});

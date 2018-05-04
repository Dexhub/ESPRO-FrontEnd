import { TestBed, async } from '@angular/core/testing';

import { SuperAdminComponent } from './super-admin.component';

describe('SuperAdminComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SuperAdminComponent
      ],
    }).compileComponents();
  }));

  it('should create the superAdmin', async(() => {
    const fixture = TestBed.createComponent(SuperAdminComponent);
    const superAdmin = fixture.debugElement.componentInstance;
    expect(superAdmin).toBeTruthy();
  }));

  it(`should have as title 'superAdmin works!'`, async(() => {
    const fixture = TestBed.createComponent(SuperAdminComponent);
    const superAdmin = fixture.debugElement.componentInstance;
    expect(superAdmin.title).toEqual('superAdmin works!');
  }));

  it('should render title in a h1 tag', async(() => {
    const fixture = TestBed.createComponent(SuperAdminComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('superAdmin works!');
  }));
});

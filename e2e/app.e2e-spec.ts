import { RoeUniformPage } from './app.po';

describe('roe-uniform App', () => {
  let page: RoeUniformPage;

  beforeEach(() => {
    page = new RoeUniformPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});

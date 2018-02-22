import { EveningstarPage } from './app.po';

describe('eveningstar App', () => {
  let page: EveningstarPage;

  beforeEach(() => {
    page = new EveningstarPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});

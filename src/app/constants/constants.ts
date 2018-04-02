import { AuthServiceConfig, GoogleLoginProvider, FacebookLoginProvider } from 'angular4-social-login';

/**
* this file defines global constants, which are used across the project
*/
export const constants = {
  /**
  * API Host Url
  */
  API_HOST: '52.87.71.251',
  /**
  * API port
  */
  API_PORT: 3010,
  /**
  * API Url
  */
  API_URL: 'http://localhost:3010/api/v1',
  SOCKET_URL: 'http://localhost:3000',
  // API_URL: 'http://eveningstar-2019458674.us-east-1.elb.amazonaws.com/api/v1',
  // SOCKET_URL: 'http://54.172.4.241:3000'
}

export const apiUrl = {
  user: `${constants.API_URL}/user`,
  balance: `${constants.API_URL}/balance`,
  trade: `${constants.API_URL}/trade`,
  portfolio: `${constants.API_URL}/portfolio`,
  coins: `${constants.API_URL}/coins`,
  assetprice: `${constants.API_URL}/assetprice`,
  exchangecoinlist: `${constants.API_URL}/exchangecoinlist`,
  coininfo: `${constants.API_URL}/coininfo`,
  coinsid: `${constants.API_URL}/coinsid`,
}

export const authServiceConfig = new AuthServiceConfig([
  {
    id: GoogleLoginProvider.PROVIDER_ID,
    provider: new GoogleLoginProvider("864084211126-6mp7rq070geovl35v6afdhhbq8rg97s0.apps.googleusercontent.com")
  },
  {
    id: FacebookLoginProvider.PROVIDER_ID,
    provider: new FacebookLoginProvider("1330643750399864")
  }
])

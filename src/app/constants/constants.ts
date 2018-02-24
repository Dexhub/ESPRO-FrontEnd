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
  API_URL: 'http://52.87.71.251:3010/api/v1'
}

export const apiUrl = {
  user: `${constants.API_URL}/user`,
  balance: `${constants.API_URL}/balance`,
  trade: `${constants.API_URL}/trade`,
  portfolio: `${constants.API_URL}/portfolio`,
  coins: `${constants.API_URL}/coins`,
  assetprice: `${constants.API_URL}/assetprice`,
  exchangecoinlist: `${constants.API_URL}/exchangecoinlist`
}

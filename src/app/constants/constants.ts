/**
* this file defines global constants, which are used across the project
*/
export const constants = {
  /**
  * API Host Url
  */
  API_HOST: 'localhost',
  /**
  * API port
  */
  API_PORT: 3010,
  /**
  * API Url
  */
  API_URL: 'http://localhost:3010/api/v1'
}

export const apiUrl = {
  user: `${constants.API_URL}/user`,
  balance: `${constants.API_URL}/balance`,
  trade: `${constants.API_URL}/trade`,
  portfolio: `${constants.API_URL}/portfolio`,
}

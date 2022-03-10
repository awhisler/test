const { WDIO } = require('../../extensions/wdio');
const login = require('./selectors');
const home = require('../home/selectors');
const env = require('../../env-urls');
const { Logger } = require('../../service/logger');

const logger = Logger.create('LoginPortal');

class LoginPortal {
  static async setUsername(username) {
    if (!username) {
      throw new Error('username required');
    } else if (username.includes('/') > 0) { // parameter name from SSM
      await WDIO.addValue(login.selector.email, user);
      logger.debug(`Username: ${user}`);
    } else {
      await WDIO.addValue(login.selector.email, username); // string value for username
      logger.debug(`Username: ${username}`);
    }
  }

  static async setPassword() {
    await WDIO.addValue(login.selector.password, '!Complex001');
  }

  static async clickLoginButton() {
    await WDIO.waitAndClick(login.selector.loginButton);
    logger.debug('Click login button');
    await WDIO.waitUntilDisplayed(home.selector.casesHeader);
  }

  /**
   * Login into Portal using the given username. Uses the predefined environment URL. If no username
   * is provided, uses the default one defined in environment config file.
   * @param {string} username username to be used for login. Defaults to
   * `env.loginInfo.default.username`.
   */
  static async login(username = env.loginInfo.default.username) {
    await WDIO.goToUrl(env.portal);
    await this.setUsername(username);
    await this.setPassword();
    await this.clickLoginButton();
  }

  /**
   * Logout from AbsenceTracker app.
   */
  static async logout() {
    await WDIO.goToUrl(new URL('/logout', env.portal));
  }

  /**
   * Go to Portal URL configured in environment.
   */
  static async goTo() {
    await WDIO.goToUrl(env.portal);
    await WDIO.waitUntilDisplayed(home.selector.casesHeader);
  }
}

module.exports = {
  LoginPortal,
};

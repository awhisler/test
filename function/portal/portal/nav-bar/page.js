const { WDIO } = require('../../extensions/wdio');
const navBar = require('./selectors');
const { Logger } = require('../../service/logger');

const logger = Logger.create('NavBarPortal');

class NavBarPortal {
  static async clickHomePageMainNav() {
    await WDIO.invisibilityOf(navBar.selector.notifyMsg, { timeout: 20000 });
    await WDIO.waitAndClick(navBar.selector.homePage);
    logger.debug('Click navbar home');
  }

  static async clickAdminPageMainNav() {
    await WDIO.invisibilityOf(navBar.selector.notifyMsg, { timeout: 20000 });
    await WDIO.waitAndClick(navBar.selector.admin);
    logger.debug('Click navbar admin');
  }

  static async clickReportsMainNav() {
    await WDIO.invisibilityOf(navBar.selector.notifyMsg, { timeout: 20000 });
    await WDIO.waitAndClick(navBar.selector.reports);
    logger.debug('Click navbar reports');
  }
}

module.exports = {
  NavBarPortal,
};

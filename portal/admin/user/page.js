const _ = require('lodash');
const { Logger } = require('../../../service/logger');
const { WDIO } = require('../../../extensions/wdio');
const user = require('./selectors');

const logger = Logger.create('User');

class User {
  /**
     * Return the list of all current users shown for the customer.
     * Should be on Users management page.
     * @returns {Promise<{name: string, login: string, role: string, status: string}[]>}
     */
  static async getCurrentUsers() {
    const resp = [];

    await WDIO.waitUntilDisplayed(user.selector.listTable);

    const usersText = await WDIO.getTextForAllTreeItems(user.selector.listItems);

    for (const userText of usersText) {
      const splitText = userText.split('\n');
      resp.push({
        name: splitText[0],
        login: splitText[1],
        role: splitText[2],
        status: splitText[3],
      });
    }

    logger.debug(`Found ${resp.length} users`);

    return resp;
  }

  /**
   * Go to a specific user edition page from the initial list based on login.
   * @param {string} login
   * @returns {Promise<boolean>} Returns true if the user was found and clicked, false otherwise.
   */
  static async selectUser(login) {
    const userItems = await this.getCurrentUsers();
    const index = _.findIndex(userItems, ['login', login]);

    if (index !== -1) {
      await WDIO.clickByIndex(user.selector.listItems, index);
      logger.debug(`Click ${login} user`);
      return true;
    }

    logger.debug(`Not found ${login} user`);
    return false;
  }

  /**
   * Return all the main information for a specific user. Should be on the user page.
   */
  static async getUserInfo() {
    return _.omitBy({
      firstName: await WDIO.getValue(user.selector.form.firstName),
      lastName: await WDIO.getValue(user.selector.form.lastName),
      title: await WDIO.getValue(user.selector.form.title),
      phone: await WDIO.getValue(user.selector.form.phone),
      cellPhone: await WDIO.getValue(user.selector.form.cellPhone),
      fax: await WDIO.getValue(user.selector.form.fax),
      endDate: await WDIO.getValue(user.selector.form.endDate),
      jobTitle: await WDIO.getValue(user.selector.form.jobTitle),
    }, _.isEmpty);
  }
}

module.exports = {
  User,
};

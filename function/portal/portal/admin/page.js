const { WDIO } = require('../../extensions/wdio');
const admin = require('./selectors');
const { Employer } = require('./employer/page');
const { Logger } = require('../../service/logger');

const logger = Logger.create('Admin');

class Admin {
  /**
   * Click 'ADD NEW EMPLOYER' button from Admin page.
   */
  static async clickAddNewEmployer() {
    await WDIO.waitAndClick(admin.selector.addLink);
    logger.debug('Click add new employer');
  }

  /**
   * Selects an employer based on its name.
   * @param {string} employerName
   */
  static async clickEmployer(employerName) {
    await WDIO.waitAndClick(admin.selector.employersLink);
    logger.debug('Click employers to expand the list');
    await WDIO.waitAndClick(admin.selector.employerListItem(employerName));
    logger.debug(`Click the employer name: ${employerName}`);
  }

  /**
   * Go to specific employer configuration page.
   * @param {string} employerName
   * @param {string} configuration
   */
  static async goToEmployerConfiguration(employerName, configuration) {
    await this.clickEmployer(employerName);

    switch (configuration) {
      case 'Custom Fields':
        return Employer.clickCustomFieldsConfiguration();
      case 'Data Upload':
        return Employer.clickDataUploadConfiguration();
      case 'Workflows':
        return Employer.clickWorkflowsConfiguration();
      case 'Communications':
        return Employer.clickCommunicationsConfiguration();
      default:
        throw new Error(`Invalid configuration '${configuration}'`);
    }
  }

  /**
   * Go to Admin Documents management page.
   */
  static async clickDocumentAdmin() {
    await WDIO.waitAndClick(admin.selector.documentAdmin);
    logger.debug('Click Document Admin link');
  }

  /**
   * Go to Users management page.
   */
  static async clickUsers() {
    await WDIO.waitAndClick(admin.selector.usersLink);
    logger.debug('Click Users link');
  }
}

module.exports = {
  Admin,
};

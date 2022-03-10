const _ = require('lodash');

const { WDIO } = require('../../../extensions/wdio');
const employer = require('./selectors');
const customField = require('./custom-fields/selectors');
const dataUpload = require('./data-upload/selectors');
const workflow = require('./workflows/selectors');
const communications = require('./communications/selectors');
const { Logger } = require('../../../service/logger');

const logger = Logger.create('Employer');

class Employer {
  /**
   * Check if all new employer fields are empty
   */
  static async verifyNewEmployerPage() {
    await WDIO.waitUntilDisplayed(employer.selector.companyName);
    expect(await WDIO.getAttribute(employer.selector.companyName, 'value')).to.equal(null);
    expect(await WDIO.getAttribute(employer.selector.refCode, 'value')).to.equal(null);
    expect(await WDIO.getAttribute(employer.selector.address, 'value')).to.equal(null);
    expect(await WDIO.getAttribute(employer.selector.city, 'value')).to.equal(null);
    expect(await WDIO.getAttribute(employer.selector.postalCode, 'value')).to.equal(null);
    expect(await WDIO.getAttribute(employer.selector.phoneNumber, 'value')).to.equal(null);
    expect(await WDIO.getAttribute(employer.selector.workHours, 'value')).to.equal(null);
  }

  /**
   * Click 'Configurations' dropdown button from selected employer
   */
  static async clickConfigurationsDropdown() {
    await WDIO.waitAndClick(employer.selector.configurations.button);
    logger.debug('Click configuration dropdown');
    await WDIO.waitUntilDisplayed(employer.selector.configurations.dropdown);
  }

  /**
   * Click 'Communications' option inside dropdown menu.
   */
  static async clickCommunicationsConfiguration() {
    await this.clickConfigurationsDropdown();
    await WDIO.clickParent(employer.selector.configurations.communicationsOption);
    logger.debug('Click on communications option.');
    await WDIO.waitUntilDisplayed(communications.selector.list);
  }

  /**
   * Click on Workflows Configuration from Employer page. Employer should be already selected.
   * This method will already click the configuration dropdown.
   */
  static async clickWorkflowsConfiguration() {
    await this.clickConfigurationsDropdown();
    await WDIO.clickParent(employer.selector.configurations.link('Workflows'));
    logger.debug('Click workflows');
    await WDIO.waitUntilDisplayed(workflow.selector.workflowItems);
  }

  /**
   * Click on Data Upload Configuration from Employer page. Employer should be already selected.
   * This method will already click the configuration dropdown.
   */
  static async clickDataUploadConfiguration() {
    await this.clickConfigurationsDropdown();
    await WDIO.clickParent(employer.selector.configurations.link('Data Upload'));
    logger.debug('Click data upload');
    await WDIO.waitUntilDisplayed(dataUpload.selector.header);
  }

  static async clickCustomFieldsConfiguration() {
    await this.clickConfigurationsDropdown();
    await WDIO.clickParent(employer.selector.configurations.link('Custom Fields'));
    logger.debug('Click custom fields');
    await WDIO.waitUntilDisplayed(customField.selector.customFieldList);
  }

  /**
   * Retrieve the selected employer main information
   */
  static async getEmployerInfo() {
    return _.omitBy({
      name: await WDIO.getValue(employer.selector.companyName),
      referenceCode: await WDIO.getValue(employer.selector.refCode),
      address: await WDIO.getValue(employer.selector.address),
      address2: await WDIO.getValue(employer.selector.address2),
      city: await WDIO.getValue(employer.selector.city),
      country: await WDIO.getValue(employer.selector.country),
      state: await WDIO.getValue(employer.selector.state),
      postalCode: await WDIO.getValue(employer.selector.postalCode),
      phoneNumber: await WDIO.getValue(employer.selector.phoneNumber),
      faxNumber: await WDIO.getValue(employer.selector.faxNumber),
    }, _.isEmpty);
  }
}

module.exports = {
  Employer,
};

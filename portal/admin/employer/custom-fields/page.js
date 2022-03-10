const _ = require('lodash');
const { WDIO } = require('../../../../extensions/wdio');
const { Logger } = require('../../../../service/logger');
const customField = require('./selectors');

const logger = Logger.create('CustomField');

class CustomField {
  /**
   * Return the list of all current custom fields created for the employer.
   * Should be on Custom Fields configuration page.
   * @returns {Promise<{
   *  name: string,
   *  code: string,
   *  description: string,
   *  customized: string,
   *  lastEdited: string
   * }[]>}
   */
  static async getCurrentCustomFields() {
    const resp = [];

    await WDIO.waitUntilDisplayed(customField.selector.customFieldList);

    const customFieldItems = await $$(customField.selector.customFieldItems);

    for (const item of customFieldItems) {
      const allText = await item.getText();
      const splitText = allText.split('\n');

      if (splitText.length === 4) {
        // As description is optional it can be empty which will make the splitText only having
        // length of 4. Here add empty string at 2nd index to represent the description.
        splitText.splice(2, 0, '');
      }

      resp.push({
        name: splitText[0],
        code: splitText[1],
        description: splitText[2],
        customized: splitText[3],
        lastEdited: splitText[4],
      });
    }

    logger.debug(`Found ${resp.length} custom fields`);

    return resp;
  }

  /**
   * Check if a custom field already exist based on its code
   * @param {string} code
   * @returns {Promise<boolean>}
   */
  static async checkIfCustomFieldExist(code) {
    logger.debug(`Check if ${code} custom field exists`);
    return _.find(await this.getCurrentCustomFields(), ['code', code]) !== undefined;
  }

  /**
   * Click on 'New Custom Field' button in Custom Fields list page.
   */
  static async clickNewCustomField() {
    await WDIO.waitAndClick(customField.selector.newCustomField);
    logger.debug('Click new custom field');
    await WDIO.waitUntilDisplayed(customField.selector.editCustomField.form);
  }

  /**
   * Set the required fields for a custom field. Should be on custom field page (new/edit).
   * @param {string} name
   * @param {string} code
   * @param {'Date' | 'Flag' | 'Number' | 'Text'} dataType
   */
  static async setRequiredFields(name, code, dataType) {
    await WDIO.setValue(customField.selector.editCustomField.name, name);
    logger.debug(`Name: ${name}`);
    await WDIO.setValue(customField.selector.editCustomField.code, code);
    logger.debug(`Code: ${code}`);
    await WDIO.selectByVisibleText(customField.selector.editCustomField.dataType, dataType);
    logger.debug(`Data Type: ${dataType}`);
  }

  /**
   * Set the optional fields for a custom field. If a parameter is undefined/null it will not be
   * set. It is possible to use empty string to clean a field value. Should be on custom field page
   * (new/edit).
   * @param {string} description
   * @param {string} helpText
   * @param {number} fileOrder
   */
  static async setOptionalFields(description, helpText, fileOrder) {
    if (!_.isNil(description)) {
      await WDIO.setValue(customField.selector.editCustomField.description, description);
      logger.debug(`Description: ${description}`);
    }

    if (!_.isNil(helpText)) {
      await WDIO.setValue(customField.selector.editCustomField.helpText, helpText);
      logger.debug(`Help Text: ${helpText}`);
    }

    if (!_.isNil(fileOrder)) {
      await WDIO.setValue(customField.selector.editCustomField.fileOrder, fileOrder);
      logger.debug(`File Order: ${fileOrder}`);
    }
  }

  /**
   * Set value type for custom field. If `Select List` is used, it is possible to include a list
   * of values using `listValues` parameter. Notice that this method will only try to add new list
   * values, and not remove them.
   * @param {'Select List' | 'User Entered'} valueType
   * @param {string[]} listValues
   */
  static async setValueType(valueType, listValues) {
    await WDIO.selectByVisibleText(customField.selector.editCustomField.valueType, valueType);
    logger.debug(`Value Type: ${valueType}`);

    if (valueType === 'Select List' && !_.isEmpty(listValues)) {
      for (const value of listValues) {
        await WDIO.setValue(customField.selector.editCustomField.enterValues, value);
        await browser.keys('Enter');
        logger.debug(`Enter value: ${value}`);
      }
    }
  }

  /**
   * Defines witch entities this custom field will be applied. By default cases will be enabled and
   * employees disabled. Should be on custom field page (new/edit).
   * @param {{
   *   cases: boolean,
   *   employees: boolean
   * }} appliesTo
   */
  static async setAppliesTo(appliesTo) {
    const casesIsSelected = await WDIO.isSelected(
      customField.selector.editCustomField.appliesTo.cases,
    );

    if (_.get(appliesTo, 'cases') === false) {
      if (casesIsSelected === true) {
        await WDIO.clickParent(customField.selector.editCustomField.appliesTo.cases);
        logger.debug('Apply To: click cases');
      }
    } else if (casesIsSelected === false) {
      await WDIO.clickParent(customField.selector.editCustomField.appliesTo.cases);
      logger.debug('Apply To: click cases');
    }

    const employeesIsSelected = await WDIO.isSelected(
      customField.selector.editCustomField.appliesTo.employees,
    );

    if (_.get(appliesTo, 'employees') === true) {
      if (employeesIsSelected === false) {
        await WDIO.clickParent(customField.selector.editCustomField.appliesTo.employees);
        logger.debug('Apply To: click employees');
      }
    } else if (employeesIsSelected === true) {
      await WDIO.clickParent(customField.selector.editCustomField.appliesTo.employees);
      logger.debug('Apply To: click employees');
    }
  }

  /**
   * Set the absence reasons for a custom field. If `absenceReasons` is empty this method does
   * nothing. Should be on custom field page (new/edit) and the custom field should be already
   * applied to cases.
   * @param {string[]} absenceReasons
   */
  static async setAbsenceReasons(absenceReasons) {
    if (!_.isEmpty(absenceReasons)) {
      const casesIsSelected = await WDIO.isSelected(
        customField.selector.editCustomField.appliesTo.cases,
      );

      if (casesIsSelected === false) {
        logger.warn('Could not set absence reasons if custom field not applied to cases');
        return;
      }

      for (const reason of absenceReasons) {
        await WDIO.waitAndClick(customField.selector.editCustomField.absenceReasons.input);
        await WDIO.clickByText(
          customField.selector.editCustomField.absenceReasons.dropdown,
          customField.selector.editCustomField.absenceReasons.dropdownItem(reason),
        );
        logger.debug(`Add absence reason: ${reason}`);
      }
    }
  }

  /**
   * Set the visibility rules for custom filed based on configuration. By default all properties
   * will be considered enabled if no value is received. Should be on custom field page (new/edit).
   * @param {{
   *   absenceTracker: {
   *     collectedAtIntake: boolean,
   *     required: boolean
   *   },
   *   ess: {
   *     visible: boolean,
   *     collectedAtIntake: boolean,
   *     required: boolean
   *   }
   * }} visibilityRules
   */
  static async setVisibilityRules(visibilityRules) {
    const collectedAtIntakeSelected = await WDIO.isSelected(
      customField.selector.editCustomField.visibilityRules.absenceTracker.collectedAtIntake,
    );

    if (_.get(visibilityRules, 'absenceTracker.collectedAtIntake') === false) {
      if (collectedAtIntakeSelected === true) {
        await WDIO.waitAndClick(
          customField.selector.editCustomField.visibilityRules.absenceTracker.collectedAtIntake,
        );
        logger.debug('Visibility AT: click collected at intake');
      }
    } else if (collectedAtIntakeSelected === false) {
      await WDIO.waitAndClick(
        customField.selector.editCustomField.visibilityRules.absenceTracker.collectedAtIntake,
      );
      logger.debug('Visibility AT: click collected at intake');
    }

    const atRequiredSelected = await WDIO.isSelected(
      customField.selector.editCustomField.visibilityRules.absenceTracker.required,
    );

    if (_.get(visibilityRules, 'absenceTracker.required') === false) {
      if (atRequiredSelected === true) {
        await WDIO.waitAndClick(
          customField.selector.editCustomField.visibilityRules.absenceTracker.required,
        );
        logger.debug('Visibility AT: click required');
      }
    } else if (atRequiredSelected === false) {
      await WDIO.waitAndClick(
        customField.selector.editCustomField.visibilityRules.absenceTracker.required,
      );
      logger.debug('Visibility AT: click required');
    }

    const essVisibleSelected = await WDIO.isSelected(
      customField.selector.editCustomField.visibilityRules.ess.visible,
    );

    if (_.get(visibilityRules, 'ess.visible') === false) {
      if (essVisibleSelected === true) {
        await WDIO.waitAndClick(
          customField.selector.editCustomField.visibilityRules.ess.visible,
        );
        logger.debug('Visibility ESS: click visible');
      }
    } else if (essVisibleSelected === false) {
      await WDIO.waitAndClick(
        customField.selector.editCustomField.visibilityRules.ess.visible,
      );
      logger.debug('Visibility ESS: click visible');
    }

    const essCollectedAtIntakeSelected = await WDIO.isSelected(
      customField.selector.editCustomField.visibilityRules.ess.collectedAtIntake,
    );

    if (_.get(visibilityRules, 'ess.collectedAtIntake') === false) {
      if (essCollectedAtIntakeSelected === true) {
        await WDIO.waitAndClick(
          customField.selector.editCustomField.visibilityRules.ess.collectedAtIntake,
        );
        logger.debug('Visibility ESS: click collected at intake');
      }
    } else if (essCollectedAtIntakeSelected === false) {
      await WDIO.waitAndClick(
        customField.selector.editCustomField.visibilityRules.ess.collectedAtIntake,
      );
      logger.debug('Visibility ESS: click collected at intake');
    }

    const essRequiredSelected = await WDIO.isSelected(
      customField.selector.editCustomField.visibilityRules.ess.required,
    );

    if (_.get(visibilityRules, 'ess.required') === false) {
      if (essRequiredSelected === true) {
        await WDIO.waitAndClick(
          customField.selector.editCustomField.visibilityRules.ess.required,
        );
        logger.debug('Visibility ESS: click required');
      }
    } else if (essVisibleSelected === false) {
      await WDIO.waitAndClick(
        customField.selector.editCustomField.visibilityRules.ess.required,
      );
      logger.debug('Visibility ESS: click required');
    }
  }

  /**
   * Click on 'Save Changes' button on Custom Field edition page.
   */
  static async clickSaveChanges() {
    await WDIO.waitAndClick(customField.selector.editCustomField.saveChanges);
    logger.debug('Click save changes');
    await WDIO.waitUntilDisplayed(customField.selector.customFieldList);
  }

  /**
   * Set the data for a custom field and save changes. Should be on custom field page (new/edit).
   * See links below for more information about each custom field properties.
   * @see {@link setRequiredFields}
   * @see {@link setOptionalFields}
   * @see {@link setValueType}
   * @see {@link setAppliesTo}
   * @see {@link setAbsenceReasons}
   * @see {@link setVisibilityRules}
   * @param {{
   *  name: string,
   *  code: string,
   *  dataType: 'Date' | 'Flag' | 'Number' | 'Text',
   *  description: string,
   *  helpText: string,
   *  fileOrder: number,
   *  valueType: 'Select List' | 'User Entered'
   *  listValues: string[]
   *  appliesTo: {
   *    cases: boolean,
   *    employees: boolean
   *  },
   *  absenceReasons: string[],
   *  visibilityRules: {
   *    absenceTracker: {
   *      collectedAtIntake: boolean,
   *      required: boolean
   *    },
   *    ess: {
   *      visible: boolean,
   *      collectedAtIntake: boolean,
   *      required: boolean
   *    }
   *  }
   * }} data
   */
  static async setCustomFieldData({
    name, code, dataType, description, helpText, fileOrder, valueType, listValues, appliesTo,
    absenceReasons, visibilityRules,
  }) {
    await this.setRequiredFields(name, code, dataType);

    await this.setOptionalFields(description, helpText, fileOrder);

    await this.setValueType(valueType, listValues);

    await this.setAppliesTo(appliesTo);

    await this.setAbsenceReasons(absenceReasons);

    await this.setVisibilityRules(visibilityRules);

    await this.clickSaveChanges();
  }

  /**
   * Create a new custom field with given data. It will check if a custom field with same
   * code already exist, and delete it if necessary before create a new one. Should be on Custom
   * Field list page.
   * @see {@link setCustomFieldData}
   * @param {{
   *  name: string,
   *  code: string,
   *  dataType: 'Date' | 'Flag' | 'Number' | 'Text',
   *  valueType: 'Select List' | 'User Entered'
   *  listValues: string[]
   *  appliesTo: {
   *    cases: boolean,
   *    employees: boolean
   *  },
   *  absenceReasons: string[],
   *  visibilityRules: {
   *    absenceTracker: {
   *      collectedAtIntake: boolean,
   *      required: boolean
   *    },
   *    ess: {
   *      visible: boolean,
   *      collectedAtIntake: boolean,
   *      required: boolean
   *    }
   *  }
   * }} data
   */
  static async createCustomField(data) {
    // First check if a custom field with same code already exist and delete it if found
    await this.deleteCustomField(data.code);

    await this.clickNewCustomField();

    await this.setCustomFieldData(data);
  }

  /**
   * Go to a specific custom field edition page from the initial list based on code.
   * @param {string} code
   * @returns {Promise<boolean>} Returns true if the custom field was found and clicked, false
   * otherwise.
   */
  static async selectCustomField(code) {
    const customFieldItems = await this.getCurrentCustomFields();
    const index = _.findIndex(customFieldItems, ['code', code]);

    if (index !== -1) {
      await WDIO.clickByIndex(customField.selector.customFieldItems, index);
      logger.debug(`Click ${code} custom field`);
      return true;
    }

    return false;
  }

  /**
   * Delete a specific custom field based on its code. Should be on Custom Field list page.
   * It does nothing if code is not found.
   * @param {string} code
   */
  static async deleteCustomField(code) {
    if ((await this.selectCustomField(code)) === true) {
      await WDIO.waitAndClick(customField.selector.editCustomField.deleteCustomField);
      logger.debug('Click delete custom field');
      expect(
        await this.checkIfCustomFieldExist(code),
        `Custom field ${code} still exist after deletion`,
      ).to.be.false;
    } else {
      logger.debug(`Not found ${code} custom field for removal`);
    }
  }
}

module.exports = {
  CustomField,
};

const _ = require('lodash');
const workflow = require('./selectors');
const { WDIO } = require('../../../../extensions/wdio');
const { Logger } = require('../../../../service/logger');

const logger = Logger.create('Workflow');

class Workflow {
  /**
   * Return the list of all current workflows created for the employer.
   * Should be on Workflow configuration page.
   * @returns {Promise<{name: string, code: string, eventType: string, status: string, lastEdited: string}[]>}
   */
  static async getCurrentWorkflows() {
    const resp = [];

    await WDIO.waitUntilDisplayed(workflow.selector.workflowItems);

    const workflowItems = await $$(workflow.selector.workflowItems);

    for (const item of workflowItems) {
      const allText = await item.getText();
      const splitText = allText.split('\n');
      resp.push({
        name: splitText[0],
        code: splitText[1],
        eventType: splitText[2],
        status: splitText[3],
        lastEdited: splitText[4],
      });
    }

    logger.debug(`Found ${resp.length} workflows`);

    return resp;
  }

  /**
   * Check if a workflow already exist based on its code
   * @param {string} code
   * @returns {Promise<boolean>}
   */
  static async checkIfWorkflowExist(code) {
    logger.debug(`Check if ${code} workflow exists`);
    return _.find(await this.getCurrentWorkflows(), ['code', code]) !== undefined;
  }

  /**
   * Create a new workflow with given name, code and event type. Should be
   * on Workflow configuration page.
   * @see {@link setWorkflowRequiredValues}
   * @param {string} name
   * @param {string} code
   * @param {string} eventType
   */
  static async createWorkflow(name, code, eventType) {
    await WDIO.waitAndClick(workflow.selector.newWorkflow);
    logger.debug('Click new workflow');
    await this.setWorkflowRequiredValues(name, code, eventType);

    try {
      await WDIO.waitAndClick(workflow.selector.editWorkflow.saveChanges, { timeout: 2000 });
    } catch (err) {
      logger.warn('Save Changes button still not appearing, update workflow name and try again');
      await WDIO.addValue(workflow.selector.editWorkflow.name, ' ');
      await WDIO.waitAndClick(workflow.selector.editWorkflow.saveChanges);
    }
    logger.debug('Click save changes');
    await WDIO.waitUntilNotDisplayed(workflow.selector.editWorkflow.saveChanges);
  }

  /**
   * During workflow edition, set the required values
   * @param {string} name
   * @param {string} code
   * @param {string} eventType
   */
  static async setWorkflowRequiredValues(name, code, eventType) {
    await WDIO.selectByVisibleText(workflow.selector.editWorkflow.eventType, eventType);
    await WDIO.setValue(workflow.selector.editWorkflow.code, code);
    await WDIO.setValue(workflow.selector.editWorkflow.name, name);
    logger.debug(`Set workflow values: name=${name}, code=${code}, type=${eventType}`);
  }

  /**
   * Edit the workflow design, adding a Case Note node. Should be called while editing a workflow
   * (after saving required values). The Case Note node will have pre-set
   * note=`Automation Test - ${eventType}` and category=`Other`.
   * @see {@link setWorkflowRequiredValues}
   * @param {string} eventType
   */
  static async designCaseNoteWorkflow(eventType) {
    await WDIO.waitAndClick(workflow.selector.editWorkflow.designWorkflow);
    logger.debug('Click design workflow');
    await WDIO.clickAndRetryIfNotDisplayed(
      async () => WDIO.waitAndClick(workflow.selector.designWorkflow.activities.case.dropdownLink),
      workflow.selector.designWorkflow.activities.case.dropdown,
    );
    logger.debug('Select Case activity dropdown');
    // There is some background setup for the drag-and-drop elements, so we need to wait some time
    // before really be able to dragAndDrop
    await browser.pause(4000);
    await WDIO.dragAndDrop(
      workflow.selector.designWorkflow.activities.case.items.caseNote,
      workflow.selector.designWorkflow.design.canvas,
    );
    logger.debug('Add case note node into workflow');
    await WDIO.waitUntilDisplayed(workflow.selector.designWorkflow.design.nodes);
    await WDIO.waitAndClick(workflow.selector.designWorkflow.design.nodes);
    logger.debug('Click case note node');
    await WDIO.waitAndClick(workflow.selector.designWorkflow.design.editNodes);
    logger.debug('Click to edit case note node');
    const note = `Automation Test - ${eventType}`;
    const category = 'Other';
    await WDIO.waitUntilDisplayed(workflow.selector.designWorkflow.design.nodeTypes.caseNote.note);
    await WDIO.setValue(workflow.selector.designWorkflow.design.nodeTypes.caseNote.note, note);
    await WDIO.selectByVisibleText(workflow.selector.designWorkflow.design.nodeTypes.caseNote.category, category);
    logger.debug(`Set case note values: note=${note}, category=${category}`);
    await WDIO.clickByText(
      workflow.selector.designWorkflow.design.nodeTypes.caseNote.modal,
      workflow.selector.designWorkflow.design.nodeTypes.caseNote.saveChanges,
    );
    logger.debug('Click save changes for case note modal');

    // After clicking save changes the page will be refreshed and its URL will change.
    const currentURL = await browser.getUrl();
    await WDIO.waitAndClick(workflow.selector.designWorkflow.design.saveChanges);
    logger.debug('Click save changes for design workflow');

    await browser.waitUntil(async function () {
      return currentURL !== (await browser.getUrl());
    });

    await WDIO.waitUntilDisplayed(workflow.selector.designWorkflow.design.nodes);
  }

  /**
   * Returns the code to be used when creating new Case Note Workflow
   * @see {@link createCaseNoteWorkflow}
   * @param {string} eventType
   * @returns {string}
   */
  static autoNoteCodeFromEventType(eventType) {
    return `AUTONOTE${eventType.replace(/ /g, '').toUpperCase()}`;
  }

  /**
   * Create the new workflow with a case note node. Should be on Workflow configuration page.
   * This method will use pre-set workflow names/codes based on eventType:
   * name=`AutomationTest - ${eventType}`
   * code=`this.autoNoteCodeFromEventType(eventType)`
   * It will check if a workflow with same code already exist. It it exist, delete it.
   * The new workflow will have a single 'Case Note' node, which will create a note named
   * `Automation Test - ${eventType}` with `Other` category.
   * @see {@link autoNoteCodeFromEventType}
   * @see {@link checkIfWorkflowExist}
   * @see {@link createWorkflow}
   * @see {@link designCaseNoteWorkflow}
   * @param {string} eventType
   */
  static async createCaseNoteWorkflow(eventType) {
    const name = `AutomationTest - ${eventType}`;
    const code = this.autoNoteCodeFromEventType(eventType);
    await this.deleteWorkflow(code);
    await this.createWorkflow(name, code, eventType);
    await this.designCaseNoteWorkflow(eventType);
  }

  /**
   * Go to a specific workflow edition page from the initial list based on code.
   * @param {string} code
   * @returns {Promise<boolean>} Returns true if the workflow was found and clicked, false otherwise.
   */
  static async selectWorkflow(code) {
    const workflowItems = await this.getCurrentWorkflows();
    const index = _.findIndex(workflowItems, ['code', code]);

    if (index !== -1) {
      await WDIO.clickByIndex(workflow.selector.workflowItems, index);
      logger.debug(`Click ${code} workflow`);
      return true;
    }

    return false;
  }

  /**
   * Delete a specific workflow based on its code. Should be on Workflow edition page.
   * Do nothing if code is not found.
   * @param {string} code
   */
  static async deleteWorkflow(code) {
    if ((await this.selectWorkflow(code)) === true) {
      await WDIO.waitUntilDisplayed(workflow.selector.editWorkflow.deleteWorkflow);
      await WDIO.waitAndClick(workflow.selector.editWorkflow.deleteWorkflow);
      logger.debug('Click delete workflow');
      expect(
        await this.checkIfWorkflowExist(code),
        `Workflow ${code} still exist after deletion`,
      ).to.be.false;
    } else {
      logger.debug(`Not found ${code} workflow for removal`);
    }
  }
}

module.exports = {
  Workflow,
};

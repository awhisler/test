const {
  format, isAfter, parse,
} = require('date-fns');
const { WDIO } = require('../../../extensions/wdio');
const { DATE_FORMAT } = require('../../../extensions/constants');
const toDo = require('./selectors');
const { Logger } = require('../../../service/logger');

const logger = Logger.create('To Do');

const textAdded = 'Automation Test';

class ToDo {
  static async clickToDo(toDoName) {
    await WDIO.waitUntilDisplayed(toDo.selector.allToDo);
    const allToDo = await $$(toDo.selector.allToDo);
    for (const aToDo of allToDo) {
      const text = await aToDo.getText();
      if (text.includes(toDoName)) {
        (await aToDo).click();
        logger.debug(`To Do ${toDoName} found and clicked`);
        return true;
      }
    }
    return false;
  }

  static async clickDueDate() {
    await WDIO.waitAndClick(toDo.selector.dueDate);
    logger.debug('Click to do due date');
  }

  static async clickModalTodayButton() {
    await WDIO.waitAndClick(toDo.selector.todayButton);
    logger.debug('Click to do modal today button');
  }

  static async clickModalSubmitButton() {
    await WDIO.waitAndClick(toDo.selector.submitButton);
    logger.debug('Click to do modal submit button');
  }

  static async addReasonText(input) {
    await WDIO.addValue(toDo.selector.reasonTextArea, input);
    await WDIO.waitUntilDisplayed(toDo.selector.reasonTextAreaNotEmpty);
  }

  /**
   * On the contact page open a paperwork due to-do and set it as received without uploading any
   * file.
   * @param {string} toDoName
   */
  static async completePaperworkDueAsReceived(toDoName) {
    await WDIO.refreshBrowserUntil(
      async () => ToDo.clickToDo(toDoName),
    );
    await WDIO.waitUntilDisplayed(toDo.selector.paperworkDueToDo.receivedButton);
    await WDIO.waitUntilStopScroll(toDo.selector.paperworkDueToDo.receivedButton);
    await this.clickPaperworkReceiveButton();
    await this.clickCompleteWithoutUploadingPaperworkButton();
  }

  static async clickPaperworkReceiveButton() {
    await WDIO.waitAndClick(toDo.selector.paperworkDueToDo.receivedButton);
    logger.debug('Click on paperwork received button');
  }

  static async clickCompleteWithoutUploadingPaperworkButton() {
    await WDIO.waitAndClick(toDo.selector.paperworkDueToDo.completeWithoutUploadButton);
    logger.debug('Click on complete without uploading paperwork button');
  }

  static async clickAddToDoButton() {
    await WDIO.waitUntilDisplayed(toDo.selector.allToDo);
    await WDIO.waitAndClick(toDo.selector.addToDoButton);
    logger.debug('Click to manually add a to do');
    await WDIO.waitUntilStopScroll(toDo.selector.modalTitle);
  }

  static async clickToDoInList(toDoName) {
    await WDIO.clickAndRetryIfNotDisplayed(
      async () => WDIO.clickByText(toDo.selector.modelToDoPopUp, `=${toDoName}`),
      `=${toDoName}`,
      { reverse: true },
    );
    logger.debug(`Click '${toDoName}' to-do in list`);
  }

  static async clickCloseCasePopupButton() {
    if (await $$(toDo.selector.closeCaseToDo.adjMessage).length > 0) {
      logger.debug('Case didn\'t actually adjudicate');
      // click update pending to denied for stability check
      await WDIO.waitAndClick(toDo.selector.closeCaseToDo.updateCheckbox);
      await $(toDo.selector.closeCaseToDo.denialReason).selectByAttribute('label', 'Exhausted');
    }

    await WDIO.clickByText(
      toDo.selector.closeCaseToDo.model,
      toDo.selector.closeCaseToDo.closeCaseButton,
    );
    logger.debug('Clicks the Close Case button in the To-Do');
    await WDIO.waitUntilDisplayed(toDo.selector.closeCaseToDo.sendCloseNoticeToDo);
  }

  static async addToDoTitleField() {
    await WDIO.addValue(toDo.selector.manualToDoTitleField, textAdded);
  }

  static async addToDoDescriptionField() {
    await WDIO.addValue(toDo.selector.manualToDoDescriptionField, textAdded);
    await WDIO.waitAndClick(toDo.selector.manualToDoDescriptionField);
  }

  static async addToDoDueDateField() {
    const today = format(new Date(), DATE_FORMAT);
    await WDIO.addValue(toDo.selector.toDoDueDateField, today);
    logger.debug(`Date for To Do: ${today}`);
  }

  static async clickToDoSubmitButton() {
    await WDIO.clickByText(toDo.selector.modelToDoPopUp, toDo.selector.manualToDoAddButton);
    logger.debug('Click to submit the manually added to do');
    await WDIO.waitUntilNotDisplayed(toDo.selector.modelToDoPopUp);
  }

  static async manuallyAddToDo() {
    await this.clickAddToDoButton();
    await this.clickToDoInList('Manual');
    await this.addToDoTitleField();
    await this.addToDoDueDateField();
    await this.addToDoDescriptionField();
    await this.clickToDoSubmitButton();
  }

  static async caseClosedAddToDo(dueDate = new Date()) {
    const addCloseCaseToDo = async () => {
      await this.clickAddToDoButton();
      await this.clickToDoInList('Close Case');
      await WDIO.setDatepickerValue(toDo.selector.toDoDueDateField, dueDate);
      logger.debug(`Case Closed due date: ${format(dueDate, DATE_FORMAT)}`);
      await this.clickToDoSubmitButton();
    };

    await addCloseCaseToDo();

    try {
      await WDIO.refreshBrowserUntil(async () => this.clickToDo('CloseCase'));
    } catch (err) {
      // In some cases after trying to add the Close Case to-do it will not really be added to
      // to-dos list. We need to try again.
      logger.warn('CloseCase not created, try to add again');
      await addCloseCaseToDo();
      await WDIO.refreshBrowserUntil(async () => this.clickToDo('CloseCase'));
    }

    await this.clickCloseCasePopupButton();
  }

  static async manuallyChangeToDoDate(toDoName) {
    await this.clickToDo(toDoName);
    await this.clickDueDate();
    await this.clickModalTodayButton();
    await this.addReasonText(textAdded);
    await this.clickModalSubmitButton();
  }

  static async changeStatusDropdown(newStatus) {
    await WDIO.waitUntilDisplayed(toDo.selector.toDoStatus);
    const currentStatusFilter = await WDIO.getText(toDo.selector.toDoStatusSelected);

    if (currentStatusFilter === newStatus) {
      return;
    }

    const oldCurrentItems = await this.getCurrentToDoItems();
    await $(toDo.selector.toDoStatus).selectByAttribute('label', newStatus);

    // Here we should wait until the to-do items change. We have the oldCurrentItems which holds the
    // items before changing the filter. We need to keep getting the items until they differ.
    // We could still have some transitions that will not reflect any change, for example changing from
    // Open to All when all items are still open. In this case we include a stop condition waitTries,
    // which will force the wait to end after 4 tries (~2s).
    let waitTries = 4;
    await browser.waitUntil(async () => {
      const newCurrentItems = await this.getCurrentToDoItems();

      if (newCurrentItems.length > 0 && oldCurrentItems.length !== newCurrentItems.length) {
        return true;
      }

      for (let i = 0; i < oldCurrentItems.length; i++) {
        const oldItem = oldCurrentItems[i];
        const newItem = newCurrentItems[i];

        if (oldItem.name !== newItem.name || oldItem.date !== newItem.date
          || oldItem.status !== newItem.status) {
          return true;
        }
      }

      if (waitTries-- === 0) {
        return true;
      }

      return false;
    }, { timeout: 8000 });
  }

  static async findAllToDoData() {
    await WDIO.waitUntilDisplayed(toDo.selector.allToDo);
    await this.changeStatusDropdown('All');
    return this.getCurrentToDoItems();
  }

  static async getCurrentToDoItems() {
    try {
      await WDIO.waitUntilDisplayed(toDo.selector.allToDo, { timeout: 2000 });
    } catch (err) {
      logger.warn('Error waiting for to-do items, consider empty');
      return [];
    }

    const response = [];
    const toDoArray = await $$(toDo.selector.allToDo);

    for (const element of toDoArray) {
      const todDoChildren = await element.$(toDo.selector.titles).getText();
      const toDoText = todDoChildren.split('\n');
      const extractedToDo = {
        name: toDoText[0],
        date: toDoText[1],
        status: toDoText[2],
      };
      response.push(extractedToDo);
    }

    return response;
  }

  static async findPaperworkDueToDo() {
    const allToDo = await this.findAllToDoData();
    const paperworkDue = [];
    for (const aToDo of allToDo) {
      if (aToDo.name.includes('Paperwork') && aToDo.name.includes('Due')) {
        paperworkDue.push(aToDo);
      }
    }
    return paperworkDue;
  }

  static async findManualToDo() {
    const allToDo = await this.findAllToDoData();
    const manualPaperworkDue = [];
    for (const aToDo of allToDo) {
      if (aToDo.name.includes(textAdded)) {
        manualPaperworkDue.push(aToDo);
      }
    }
    return manualPaperworkDue;
  }

  static async findToDoStatus(method, status) {
    for (const aToDo of method) {
      if (aToDo.status !== status) {
        return false;
      }
    }
    return true;
  }

  static async refreshUntilToDosDisplay(status) {
    logger.debug(`Starting refresh page to find ${status} to do's`);
    const paperworkDues = await this.findPaperworkDueToDo();
    for (const aToDo of paperworkDues) {
      if (await aToDo.status !== status) {
        await browser.refresh();
        await this.refreshUntilToDosDisplay(status);
        break;
      }
    }
  }

  static async findPaperworkDueToDoDate() {
    const today = new Date();
    const paperworkDues = await this.findPaperworkDueToDo();

    for (const aToDo of paperworkDues) {
      if (isAfter(parse(aToDo.date, DATE_FORMAT, new Date()), today)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get ToDo Attachment file name
   * @returns {Promise<string>} name of the file attached to Case
   */
  static async getFileNameAttachedToCase() {
    return WDIO.getText(toDo.selector.modalAttachment);
  }

  /**
   * Method that verifies the ToDo table contents contains
   * specific information in any given line
   * @param {string} toDoName Name of the ToDo, in the first column
   * @param {string} toDoDueDate Due Date of the ToDo, in the second column
   * @param {string} toDoStatus Status of the Todo, in the third column
   */
  static async verifyToDoLine(toDoName, toDoDueDate, toDoStatus) {
    const toDoItems = await ToDo.findAllToDoData();
    let passed = false;
    for (let i = 0; i < toDoItems.length; i++) {
      const arrayItem = toDoItems[i];
      if (arrayItem.name.includes(toDoName) && arrayItem.status === toDoStatus
        && arrayItem.date === toDoDueDate) {
        logger.debug(
          `Expected to-do line has been found: ${toDoName} | ${toDoDueDate} | ${toDoStatus}`,
        );
        passed = true;
        break;
      }
    }
    expect(passed, `ToDo Line with Name = ${toDoName} , Status = ${toDoStatus} , Date = ${toDoDueDate} was not found`).to.be.true;
  }
}

module.exports = {
  ToDo,
};

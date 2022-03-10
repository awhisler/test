// const { isNull } = require('lodash');
const _ = require('lodash');
const { WDIO } = require('../../../../extensions/wdio');
const { Logger } = require('../../../../service/logger');
const communications = require('./selectors');

const logger = Logger.create('Communications');

class Communications {
  static async getCommunication(communicationName) {
    await WDIO.scrollUntilTheEnd(communications.selector.list, 3);
    const communicationSelected = await this.selectCommunication(communicationName);

    expect(communicationSelected, `Name Not Found - ${communicationName}`).to.be.not.null;

    delete communicationSelected.status;
    delete communicationSelected.lastEdited;
    communicationSelected.attachments = await this.getAttachments();
    logger.debug(`Got the following communication's object:\n ${JSON.stringify(communicationSelected)}`);
    return communicationSelected;
  }

  static async selectCommunication(name) {
    const communicationsItems = await this.getCurrentCommunications();
    const index = _.findIndex(communicationsItems, ['name', name]);

    if (index !== -1) {
      await WDIO.clickByIndex(communications.selector.list, index);
      logger.debug(`Click ${name} communication`);
      return communicationsItems[index];
    }
    return null;
  }

  static async getCurrentCommunications() {
    await WDIO.waitUntilDisplayed(communications.selector.list);

    const customFieldItems = await $$(communications.selector.list); // We should create a WDIO.getTextArray and move there this line and the line below
    const allText = await Promise.all(customFieldItems.map((item) => item.getText()));
    const resp = allText
      .map((text) => text.split('\n'))
      .map((splitText) => ({
        name: splitText[0],
        code: splitText[1],
        documentType: splitText[2],
        status: splitText[3],
        lastEdited: splitText[4],
      }));

    logger.debug(`Found ${resp.length} custom fields`);

    return resp;
  }

  static async getAttachments() {
    const attachmentObject = { attachments: null };
    const attachmentName = await $(communications.selector.attachments).getText();
    const splitText = attachmentName.split('\n');
    attachmentObject.attachments = splitText;
    logger.debug(`Got following attachments:\n ${splitText}`);
    return (splitText[0] ? attachmentObject.attachments : []);
  }
}

module.exports = {
  Communications,
};

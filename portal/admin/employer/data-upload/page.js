const allureReporter = require('@wdio/allure-reporter').default;
const { WDIO } = require('../../../../extensions/wdio');
const dataUpload = require('./selectors');

class DataUpload {
  // must already be on the Data Upload page
  static async uploadEligibilityFile(filePath) {
    await WDIO.uploadFile(dataUpload.selector.eligibilityInput, filePath);
    allureReporter.addAttachment('File path for EL File', filePath);
    await WDIO.invisibilityOf(dataUpload.selector.loadingSpinner);
  }

  // must already be on the Data Upload page
  static async uploadImportFile(filePath) {
    await WDIO.uploadFile(dataUpload.selector.fileImportInput, filePath);
    allureReporter.addAttachment('File path for Import File', filePath);
    await WDIO.invisibilityOf(dataUpload.selector.loadingSpinner);
  }

  // must already be on the Data Upload page
  static async uploadCaseFile(filePath) {
    await WDIO.uploadFile(dataUpload.selector.caseImportInput, filePath);
    allureReporter.addAttachment('File path for Case File', filePath);
    await WDIO.invisibilityOf(dataUpload.selector.loadingSpinner);
  }
}

module.exports = {
  DataUpload,
};

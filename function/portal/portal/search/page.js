const { WDIO } = require('../../extensions/wdio');
const search = require('./selectors');
const cases = require('../cases/selectors');
const { Logger } = require('../../service/logger');

const logger = Logger.create('SearchPortal');

class SearchPortal {
  static async addTermAndSearch(term) {
    logger.debug(`Searched term: ${term}`);
    await WDIO.addValue(search.selector.searchField, term);
    await WDIO.waitAndClick(search.selector.searchButton);
    logger.debug('Click search button');
    await WDIO.refreshBrowserUntil(
      async () => {
        try {
          await WDIO.waitUntilDisplayed(search.selector.rowItems, { timeout: 1000 });
          return true;
        } catch (err) {
          return false;
        }
      },
    );
  }

  static async verifySearchResults(searchType) {
    const resultsCount = await WDIO.getArrayCountBy(this.getSearchResultSelector(searchType));
    logger.debug(`${searchType} results count returned: ${resultsCount}`);
    return resultsCount;
  }

  static async selectCaseFromSearch() {
    await WDIO.waitAndClick(search.selector.caseHeader);
    logger.debug('Click case from search results - assumption one case returns');
    await WDIO.waitUntilTextNotEmpty(cases.selector.caseInfo.caseId);
    await WDIO.waitUntilTextNotEmpty(cases.selector.caseInfo.employeeNumber);
  }

  static async selectEmpFromSearch() {
    await WDIO.waitAndClick(search.selector.empHeader);
    logger.debug('Click employee from search results - assumption one case returns');
  }

  static async verifySearchCount() {
    const searchCount = await WDIO.getText(search.selector.searchCount);
    const searchCountConvert = parseFloat(searchCount);
    expect(searchCountConvert).to.be.greaterThanOrEqual(1);
  }

  static async verifyCaseCount() {
    const caseCount = await WDIO.getText(search.selector.caseCount);
    return caseCount;
  }

  static async getDataFromSearch(data, regex) {
    const selectorText = await WDIO.getText(data);
    logger.debug(`Search text to review: ${selectorText}`);
    return selectorText.match(regex)[1]; // will not work with global regex flag if you are using groups
  }

  static async returnCaseNumCaseRow() {
    return this.getDataFromSearch(search.selector.caseHeader, /Case: (\d*)/);
  }

  static async returnEmployeeNameCaseRow() {
    return this.getDataFromSearch(search.selector.caseSubheader, /Employee: (.*) \(/);
  }

  static async returnEmployeeNumCaseRow() {
    return this.getDataFromSearch(search.selector.caseSubheader, /\(#(.*)\)/);
  }

  static async returnEmployeeNameEmpRow() {
    return this.getDataFromSearch(search.selector.empHeader, /(.*) \(#.*/);
  }

  static async returnEmployeeEmailCaseRow() {
    return this.getDataFromSearch(search.selector.caseSubheader, /.*\| (.*@.*)/);
  }

  static async returnEmployeeEmailEmpRow() {
    return this.getDataFromSearch(search.selector.empSubheader, /.*\| (.*@.*)/);
  }

  static async returnEmployeeNumEmpRow() {
    return this.getDataFromSearch(search.selector.empHeader, /\(#(.*)\)/);
  }

  static getSearchResultSelector(searchType) {
    let selector = '';
    switch (searchType?.toLowerCase()) {
      case 'case':
        selector = search.selector.caseHeader;
        break;
      case 'emp':
      case 'employee':
        selector = search.selector.empHeader;
        break;
      default:
        selector = search.selector.rowItems;
    }
    return selector;
  }
}

module.exports = {
  SearchPortal,
};

const { WDIO } = require('../../extensions/wdio');
const home = require('./selectors');
const { NavBarPortal } = require('../nav-bar/page');
const { Logger } = require('../../service/logger');

const logger = Logger.create('Home');

class Home {
  static async getVisibleDashboardToDoItems() {
    await WDIO.waitUntilDisplayed(home.selector.toDoItems);
    return $$(home.selector.toDoSection.items);
  }

  static async getVisibleDashboardEmployeeItems() {
    await WDIO.waitUntilDisplayed(home.selector.employeeItems);
    return $$(home.selector.employeeItems);
  }

  static async getVisibleDashboardCaseItems() {
    await WDIO.waitUntilDisplayed(home.selector.caseItems);
    return $$(home.selector.caseItems);
  }

  static async filterDashboardToDosByEmployee(filterText) {
    await WDIO.addValue(home.selector.toDoSection.filters.employee, filterText);
    logger.debug(`Filter To Do's on the dashboard by ${filterText}`);
    await WDIO.waitUntilDisplayed(home.selector.toDoSection.textWait);
  }

  static async filterDashboardToDosByStatus(option) {
    await WDIO.selectByIndex(home.selector.toDoSection.filters.status, option);
    logger.debug(`Filter To Do's on the dashboard by ${option}`);
    await WDIO.waitUntilDisplayed(home.selector.toDoSection.textWait);
  }

  static async filterDashboardEmployeesByName(filterText) {
    const oldEmployeeItems = await this.getVisibleDashboardEmployeeItems();
    await WDIO.addValue(home.selector.employeesNameFilterInput, filterText);
    logger.debug(`Filter Employee's on the dashboard by ${filterText}`);

    // Wait until the list of visible employees change. For employee filter we usually will
    // want to get just 1 employee from search, so oldEmployeeItems would have 10 items and
    // newEmployeeItems will have 1 at some point.
    await browser.waitUntil(async () => {
      const newEmployeeItems = await this.getVisibleDashboardEmployeeItems();

      // New list should not be empty and should have different size from old list
      if (newEmployeeItems.length > 0 && oldEmployeeItems.length !== newEmployeeItems.length) {
        return true;
      }

      // If the old list only had 1 item, then it should be a situation where we just have 1
      // employee in the system. Just return true here as we will not be able to properly detect
      // the list change anyway.
      if (oldEmployeeItems.length === 1) {
        return true;
      }

      return false;
    });
  }

  static async filterDashboardCasesByEmployee(filterText) {
    await WDIO.slowAddValue(home.selector.casesEmployeeFilterInput, filterText);
    logger.debug(`Filter Cases's on the dashboard by ${filterText}`);
  }

  static async clickViewAllEmployees() {
    await WDIO.waitAndClick(home.selector.viewAllEmployeesLink);
    logger.debug('Click view all employees link');
  }

  static async clickCreateNewEmployees() {
    await WDIO.waitAndClick(home.selector.createEmployee);
    logger.debug('Click create new employee link');
  }

  static async clickFirstVisibleEmployeeItem() {
    await WDIO.clickByIndex(home.selector.employeeItems, 0);
    logger.debug('Click first visible employee');
  }

  static async selectViewAllItems() {
    await WDIO.selectByIndex(home.selector.dashboardViewItemsDropDown, 2);
  }

  static async findEmployeeOnHomePage(employeeName) {
    await NavBarPortal.clickHomePageMainNav();
    await Home.selectViewAllItems();
    await Home.filterDashboardEmployeesByName(employeeName);
    await Home.clickFirstVisibleEmployeeItem();
  }
}

module.exports = {
  Home,
};

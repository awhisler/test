const _ = require('lodash');
const {
  format, isBefore, parse, addDays, subDays,
} = require('date-fns');
const { WDIO } = require('../../extensions/wdio');
const { DATE_FORMAT } = require('../../extensions/constants');
const { Employee } = require('../employee/page');
const cases = require('./selectors');
const essCases = require('../../ess/cases/selectors');
const caseActivity = require('./case-activity/selectors');
const workScheduleEdit = require('../employee/edit-schedule/selectors');
const { Logger } = require('../../service/logger');
const { REASON_TO_CLASS_MAP } = require('./reasons/map');
const { DenialReason } = require('../../api/cases/itor/fixtures/denial-reason');

const logger = Logger.create('CasePortal');

class CasePortal {
  /**
   * Select a case from 'Case History' section based on its id/number.
   * @param {string} caseId case number
   */
  static async selectCaseInCaseHistory(caseId) {
    await WDIO.clickByText(cases.selector.caseHistory.directive, `=${caseId}`);
    logger.debug(`Click case ${caseId}`);
  }

  /**
   * Creates a new case starting from employee page. It will set the type, startDate and endDate.
   * @see {@link Employee.clickNewCase}
   * @see {@link selectCaseType}
   * @see {@link setStartEndDatesForCaseType}
   * @param {'Consecutive' | 'Intermittent' | 'Reduced' | 'Administrative'} type Reason type
   * @param {Date} startDate Start expected case date
   * @param {Date} endDate End expected case date
   */
  static async createNewCaseAndSetDates(type, startDate, endDate) {
    await Employee.clickNewCase();
    await this.selectCaseType(type);
    await this.setStartEndDatesForCaseType(startDate, endDate);
  }

  /**
   * Fill the required information for case reporter section when creating a new case
   * @param {string} firstName Reporter first name
   * @param {string} lastName Reporter last name
   * @param {string} relationship Reporter relationship. It should be one of the values shown in
   * selection input.
   */
  static async setRequiredCaseReporterInfo(firstName, lastName, relationship) {
    await WDIO.setValue(cases.selector.createCaseForm.caseReporter.firstName, firstName);
    await WDIO.setValue(cases.selector.createCaseForm.caseReporter.lastName, lastName);
    logger.debug(`Name entered for case reporter: ${firstName} ${lastName}`);
    await WDIO.selectByVisibleText(cases.selector.createCaseForm.caseReporter.relationship, relationship);
    logger.debug(`Relationship: ${relationship}`);
  }

  /**
   * Click on one of the available dates options when creating a new case.
   * @param {'Consecutive' | 'Intermittent' | 'Reduced' | 'Administrative'} type Reason type
   */
  static async selectCaseType(type) {
    const buttonGroup = ['Consecutive', 'Intermittent', 'Reduced', 'Administrative'];

    expect(buttonGroup, `Invalid Case Type ${type}`).to.include(type);

    const buttonGroupIndex = buttonGroup.indexOf(type);

    // Get the button group inputs, where reason type buttons are located. We need to click on parent
    // element, as the inputs themselves will not be clickable.
    await WDIO.clickAndRetryIfNotDisplayed(
      async () => WDIO.clickByIndexParent(
        cases.selector.createCaseForm.caseTypeButtonGroupInputs,
        buttonGroupIndex,
      ),
      cases.selector.createCaseForm.reasonsItems,
    );
    logger.debug(`Click ${type}`);
  }

  /**
   * From new case page gets the employee main info: Hire Date.
   * @returns {Promise<{hireDate: string}>}
   */
  static async getEmployeeInfo() {
    const hireDate = await WDIO.getText(cases.selector.employeeInfo.hireDate);

    return { hireDate };
  }

  /**
   * Fill the start/end Expected Case Dates. Those dates should be shown after selecting a case type.
   * This method check if the dates are valid according to employee hire date.
   * @see {@link selectCaseType}
   * @param {Date} startDate Start expected case date
   * @param {Date} endDate End expected case date
   */
  static async setStartEndDatesForCaseType(startDate, endDate) {
    expect(
      isBefore(startDate, endDate),
      `Start date should be less than end date: ${format(startDate, DATE_FORMAT)}/${format(endDate, DATE_FORMAT)}`,
    ).to.be.true;

    const employeeInfo = await this.getEmployeeInfo();

    expect(
      isBefore(parse(employeeInfo.hireDate, DATE_FORMAT, new Date()), startDate),
      `Start date should be greater than employee hire date: ${employeeInfo.hireDate}/${format(startDate, DATE_FORMAT)}`,
    ).to.be.true;

    await WDIO.setDatepickerValue(cases.selector.createCaseForm.expectedCaseDates.start, startDate);
    logger.debug(`Expected Start Date: ${format(startDate, DATE_FORMAT)}`);
    await WDIO.setDatepickerValue(cases.selector.createCaseForm.expectedCaseDates.end, endDate);
    logger.debug(`Expected End Date: ${format(endDate, DATE_FORMAT)}`);

    await WDIO.waitUntilDisplayed(cases.selector.createCaseForm.reasonsItems);
  }

  /**
   * Click on 'Calculate Eligibility' button when creating a new case. All the necessary information
   * (Case Reporter / Case Type / Case Reason) should be set first for it be available.
   */
  static async clickCalculateEligibility() {
    await WDIO.waitAndClick(cases.selector.createCaseForm.calculateEligibility);
    logger.debug('Click calculate eligibility');
    await WDIO.waitUntilDisplayed(cases.selector.createCaseForm.contactInfo.header, { timeout: 20000 });
    await WDIO.waitUntilDisplayed(cases.selector.createCaseForm.createCaseText);
    await WDIO.waitUntilStopScroll();
  }

  /**
   * Returns all initial policies listed at Review Polices sections when creating a new case.
   * It should be shown only after calculate the eligibility.
   * @see {@link clickCalculateEligibility}
   * @returns {Promise<{name: string, requestedStart: string, requestedEnd: string, eligible: string}[]>}
   */
  static async getNewCaseReviewPolicies() {
    const resp = [];

    if (await this.isPoliciesEmpty()) {
      return resp;
    }

    // First get all polices rows
    const policesRows = await $$(cases.selector.createCaseForm.reviewPolices.tableRows);

    // For each table row, extract the name, requestedStart, requestedEnd, eligible info
    for (const row of policesRows) {
      const policy = {};

      // First get all the columns from row
      const columns = await row.$$('div');

      // Extract necessary information from columns
      policy.name = await columns[0].getText();
      policy.requestedStart = await columns[1].getText();
      policy.requestedEnd = await columns[2].getText();
      policy.eligible = await columns[4].getText();

      resp.push(policy);
    }
    logger.debug(`Policy Information: ${JSON.stringify(resp)}`);

    return resp;
  }

  /**
   * Check whether there are policies available or not.
   * @returns {Promise<boolean>}
   */
  static async isPoliciesEmpty() {
    try {
      await WDIO.waitUntilDisplayed(cases.selector.createCaseForm.reviewPolices.tableRows);
      return false;
    } catch {
      return true;
    }
  }

  /**
   * Add manually a new policy to the case.
   * @param {string} policy policy to be manually added
   */
  static async addManualPolicy(policy) {
    await WDIO.selectByVisibleText(cases.selector.addManualPolicy, policy);
    const currentPolicy = await CasePortal.getManualPolicyByName(policy);
    if (currentPolicy === null) {
      throw new Error(`Could not add the following policy: ${policy}`);
    }
  }

  /**
   * Check whether 'Create Case' button is clickable or not.
   */
  static async assertCreateCaseClickable() {
    await WDIO.assertClickableByText(
      cases.selector.createCaseForm.selector,
      cases.selector.createCaseForm.createCaseText,
    );
    logger.debug('Create case is clickable');
  }

  /**
   * Click on 'Create Case' button. This button will only be displayed after calculate availability.
   * @see {@link clickCalculateEligibility}
   */
  static async clickCreateCase() {
    await WDIO.clickByText(
      cases.selector.createCaseForm.selector,
      cases.selector.createCaseForm.createCaseText,
    );
    logger.debug('Click create case');
  }

  /**
   * This method should check if the case was successfully created. It will wait for 'New Case' modal
   * appear and check the success message. Finally it will close the modal clicking in
   * 'No, thanks. I'll create a communication later.' button.
   */
  static async checkCreatedSuccessfullyModal() {
    const displayedSelector = await WDIO.waitUntilOneDisplayed(
      [cases.selector.newCaseFinalModal.successText, cases.selector.caseInfo.caseId],
      { timeout: 30000 },
    );

    if (displayedSelector === cases.selector.newCaseFinalModal.successText) {
      await WDIO.waitAndClick(cases.selector.newCaseFinalModal.createCommunicationLaterText);
      logger.debug('Click create communication later');
    } else {
      logger.warn('New case modal did not appear');
    }
  }

  /**
   * From employee page creates a new case using the given `options`. Additionally checks calculated
   * polices using `checkPoliciesFunction` function, which will receive the return from
   * {@link getNewCaseReviewPolicies}. Uses `REASON_TO_CLASS_MAP` to associate a given reason name
   * to its implementation.
   * @param {{
   *  type: 'Consecutive' | 'Intermittent' | 'Reduced' | 'Administrative',
   *  start: Date,
   *  end: Date,
   *  reason: {
   *    name: string,
   *    config: object
   *  },
   *  checkPoliciesFunction: () => void | undefined
   * }} options
   * @returns {Promise<{
   *  caseId: string,
   *  caseReason: string,
   *  employeeNum: string
   * }>} returns the new created case details.
   */
  static async createNewCase({
    type, start, end, reason, checkPoliciesFunction,
  }) {
    // Create a new case using consecutive dates and the specified reason
    await this.createNewCaseAndSetDates(type, start, end);

    await CasePortal.checkCasePolicies({ reason, checkPoliciesFunction });

    // Finish case creation, check creation success modal
    await CasePortal.clickCreateCase();
    await CasePortal.checkCreatedSuccessfullyModal();

    return this.getCaseDetails();
  }

  /**
   * Checks calculated polices using `checkPoliciesFunction` function, which will receive the return from
   * {@link getNewCaseReviewPolicies}. Uses `REASON_TO_CLASS_MAP` to associate a given reason name
   * to its implementation.
   * @param {{
   *  reason: {
   *    name: string,
   *    config: object
   *  },
   *  checkPoliciesFunction: () => void | undefined
   * }} options
   */
  static async checkCasePolicies({
    reason, checkPoliciesFunction,
  }) {
    const ReasonClass = REASON_TO_CLASS_MAP[reason.name];

    if (_.isNil(ReasonClass)) {
      throw new Error(`Invalid reason '${reason.name}'`);
    }

    await ReasonClass.setReason(reason.config);

    await this.clickCalculateEligibility();

    // Check polices if `checkPoliciesFunction` is set
    if (_.isFunction(checkPoliciesFunction)) {
      const policies = await CasePortal.getNewCaseReviewPolicies();
      checkPoliciesFunction(policies);
    }

    await CasePortal.assertCreateCaseClickable();
  }

  /**
   * Click on 'Change Case' button from Case view page.
   */
  static async clickChangeCase() {
    await WDIO.waitUntilTextNotEmpty(cases.selector.caseInfo.id);
    await WDIO.waitUntilTextNotEmpty(cases.selector.caseInfo.employeeNumber);
    await WDIO.waitAndClick(cases.selector.changeCaseButton);
    logger.debug('Click change case');
    await WDIO.waitUntilDisplayed(cases.selector.changeCaseModal.selector);
    await WDIO.waitUntilStopScroll(cases.selector.changeCaseModal.startDate);
  }

  /**
   * Change start or end dates for a case. It will automatically select new start/end dates checkboxes.
   * @param {Object} params params with the new case changes
   * @param {Date} [params.start]
   * @param {Date} [params.end]
   * @param {'Consecutive' | 'Intermittent' | 'Reduced' | 'Administrative'} [params.caseType]
   */
  static async changeCase({ start, end, caseType }) {
    await this.clickChangeCase();

    if (_.isDate(start)) {
      await WDIO.setDatepickerValue(cases.selector.changeCaseModal.startDate, start);
      await WDIO.waitAndClick(cases.selector.changeCaseModal.newStart);
      logger.debug(`Set new case start date: ${format(start, DATE_FORMAT)}`);
    }

    if (_.isDate(end)) {
      await WDIO.setDatepickerValue(cases.selector.changeCaseModal.endDate, end);
      await WDIO.waitAndClick(cases.selector.changeCaseModal.newEnd);
      logger.debug(`Set new case end date: ${format(end, DATE_FORMAT)}`);
    }

    if (!(_.isNil(caseType))) {
      await WDIO.waitAndClick(cases.selector.changeCaseModal.type(caseType));
      logger.debug(`Set new case type: ${caseType}`);
    }

    await WDIO.clickByText(
      cases.selector.changeCaseModal.selector,
      cases.selector.changeCaseModal.updateCase,
    );
    logger.debug('Click update case');
    // wait until modal closes
    await WDIO.waitUntilNotDisplayed(`${cases.selector.changeCaseModal.selector}[style='display: block;']`);
  }

  /**
   * Cancel a case using the given reason. Uses 'Other' reason by default. Should be on case page.
   * @param {'Other' | 'LeaveNotNeededOrCancelled' | 'EnteredInError' | 'InquiryClosed'} reason
   */
  static async cancelCase(reason = 'Other') {
    await this.clickChangeCase();

    // Check if it is a reduced case. In this case set the start/end dates for schedule if not set,
    // as it will block the case cancel
    const scheduleStartDate = await $$(cases.selector.changeCaseModal.reducedSchedule.startDate);

    if (!_.isEmpty(scheduleStartDate) && (await scheduleStartDate[0].isDisplayed())) {
      await WDIO.setDatepickerValue(
        cases.selector.changeCaseModal.reducedSchedule.startDate,
        new Date(),
      );
      await WDIO.setDatepickerValue(
        cases.selector.changeCaseModal.reducedSchedule.endDate,
        new Date(),
      );
    }

    await WDIO.clickByText(
      cases.selector.changeCaseModal.selector,
      cases.selector.changeCaseModal.cancelCase,
    );
    logger.debug('Click cancel case');

    await WDIO.waitUntilDisplayed(cases.selector.changeCaseModal.caseCancelReasonOptions(reason));
    await WDIO.selectByVisibleText(cases.selector.changeCaseModal.caseCancelReason, reason);
    logger.debug(`Select '${reason}' cancel reason`);

    await WDIO.waitAndClick(cases.selector.changeCaseModal.caseCancelConfirmation);
    logger.debug('Click cancel case (confirmation)');

    await WDIO.waitUntilNotDisplayed(cases.selector.changeCaseModal.selector);
    await WDIO.waitUntilTextNotEmpty(cases.selector.employeeInfo.hireDate);
  }

  static async clickCommunications() {
    await WDIO.waitAndClick(cases.selector.communicationButton);
    logger.debug('Click communications button');
  }

  static async clickReturnToCase() {
    await WDIO.waitAndClick(cases.selector.returnToCaseButton);
    logger.debug('Click communications button');
  }

  static async clickCaseActivity() {
    await WDIO.clickAndRetryIfNotDisplayed(
      async () => WDIO.waitAndClick(cases.selector.caseActivityButton),
      caseActivity.selector.allCaseActivities,
    );
  }

  /**
   * Retrieves basic case information from case page.
   * @returns {Promise<{
   *  caseId: string,
   *  caseReason: string,
   *  caseType: string,
   *  caseRequestedStart: string,
   *  caseRequestedEnd: string,
   *  employeeNum: string
   * }>}
   */
  static async getCaseDetails() {
    const caseId = await WDIO.getText(cases.selector.caseInfo.caseId);
    logger.debug(`Case ID from Portal: ${caseId}`);

    const caseReason = await WDIO.getText(cases.selector.caseInfo.caseReason);
    logger.debug(`Case reason from Portal: ${caseReason}`);

    const caseType = await WDIO.getText(cases.selector.caseInfo.type);
    logger.debug(`Case type from Portal: ${caseType}`);

    const caseRequestedStart = await WDIO.getText(cases.selector.caseInfo.requestedStart);
    logger.debug(`Case request start from Portal: ${caseRequestedStart}`);

    const caseRequestedEnd = await WDIO.getText(cases.selector.caseInfo.requestedEnd);
    logger.debug(`Case request end from Portal: ${caseRequestedEnd}`);

    const employeeNum = await WDIO.getText(cases.selector.caseInfo.employeeNumber);
    logger.debug(`Employee number from Portal: ${employeeNum}`);

    return {
      caseId,
      caseReason,
      caseType,
      caseRequestedStart,
      caseRequestedEnd,
      employeeNum,
    };
  }

  /**
   * Click 'Intermittent Request' button in cases page.
   */
  static async clickIntermittentRequest() {
    await WDIO.waitUntilTextNotEmpty(cases.selector.caseInfo.caseId);
    await WDIO.waitUntilTextNotEmpty(cases.selector.caseInfo.employeeNumber);
    await WDIO.clickAndRetryIfNotDisplayed(
      async () => WDIO.waitAndClick(cases.selector.intermittentRequestButton),
      cases.selector.intermittentRequestModal.selector,
    );
    logger.debug('Click intermittent request');

    // The modal appear using a vertical slide out animation, so wait for any date element stop
    // scroll as it could impact datepickers.
    await WDIO.waitUntilStopScroll(cases.selector.intermittentRequestModal.date);
  }

  /**
   * Click on 'Submit' button for 'Intermittent Request' modal. It will automatically proceed with
   * the form submission in case of warnings.
   */
  static async submitIntermittentRequest() {
    await WDIO.clickByText(
      cases.selector.intermittentRequestModal.selector,
      cases.selector.intermittentRequestModal.submit,
    );
    logger.debug('Click submit');

    try {
      await WDIO.waitUntilDisplayed(cases.selector.intermittentRequestModal.warningPopUp.selector);
      await WDIO.waitUntilStopScroll(cases.selector.intermittentRequestModal.warningPopUp.yes);
      await WDIO.clickByText(
        cases.selector.intermittentRequestModal.warningPopUp.selector,
        cases.selector.intermittentRequestModal.warningPopUp.yes,
      );
      logger.debug('Click yes, proceed');
    } catch (err) {
      logger.debug('Submit called without warnings');
    }

    await WDIO.waitUntilNotDisplayed(cases.selector.intermittentRequestModal.selector);
  }

  /**
   * Update an intermittent request using the given parameters. Undefined/null values will be
   * ignored.
   * @param {{
   *  type: 'Office Visit' | 'Incapacity'
   *  date: Date,
   *  approved: {hours: number, minutes: number},
   *  pending: {hours: number, minutes: number},
   *  denied: {
   *    hours: number,
   *    minutes: number
   *    reason: import('../../../function/api/itor/fixtures/denial-reason').DenialReason,
   *    otherReason: string
   *  }
   * }} intermittentRequest
   */
  static async updateIntermittentRequest({
    type, date, approved, pending, denied,
  }) {
    if (!_.isNil(type)) {
      await WDIO.selectByVisibleText(cases.selector.intermittentRequestModal.type, type);
      logger.debug(`Type: ${type}`);
    }

    if (!_.isNil(date)) {
      await WDIO.setDatepickerValue(cases.selector.intermittentRequestModal.date, date);
      logger.debug(`Date: ${format(date, DATE_FORMAT)}`);
    }

    if (!_.isNil(approved)) {
      await WDIO.setDurationValue(cases.selector.intermittentRequestModal.approved, approved);
      logger.debug(`Approved: ${approved.hours}h ${approved.minutes}m`);
    }

    if (!_.isNil(denied)) {
      await WDIO.setDurationValue(cases.selector.intermittentRequestModal.denied, denied);
      let debugMessage = `Denied: ${denied.hours}h ${denied.minutes}m`;
      if (!_.isNil(denied.reason)) {
        await WDIO.waitUntilDisplayed(cases.selector.intermittentRequestModal.denialReasonSelect);
        await WDIO.setSelectOptionByValue(cases.selector.intermittentRequestModal.denialReasonSelect, `string:${denied.reason.code}`);
        debugMessage += ` (with denial reason: ${denied.reason.code})`;

        if (denied.reason === DenialReason.Other && !_.isNil(denied.otherReason)) {
          await WDIO.waitUntilDisplayed(cases.selector.intermittentRequestModal.denialReasonSelect);
          await WDIO.setValue(cases.selector.intermittentRequestModal.denialReasonOther, denied.otherReason);
          debugMessage += ` (with other denial reason value: ${denied.otherReason})`;
        }
      }
      logger.debug(debugMessage);
    }

    if (!_.isNil(pending)) {
      await WDIO.setDurationValue(cases.selector.intermittentRequestModal.pending, pending);
      logger.debug(`Pending: ${pending.hours}h ${pending.minutes}m`);
    }

    await this.submitIntermittentRequest();
  }

  /**
   * Create a new intermittent request using the given parameters.
   *
   * @param {{
   *  type: 'Office Visit' | 'Incapacity'
   *  date: Date,
   *  approved: {hours: number, minutes: number},
   *  pending: {hours: number, minutes: number}
   *  denied: {
   *    hours: number,
   *    minutes: number
   *    reason: import('../../../function/api/itor/fixtures/denial-reason').DenialReason,
   *    otherReason: string
   *  }
   * }} intermittentRequest
   */
  static async addIntermittentRequest({
    type = 'Incapacity',
    date = new Date(),
    approved = { hours: 0, minutes: 0 },
    pending = { hours: 1, minutes: 0 },
    denied = {
      hours: 0,
      minutes: 0,
      reason: null,
      otherReason: null,
    },
  } = {}) {
    await this.clickIntermittentRequest();
    await this.updateIntermittentRequest({
      type,
      date,
      approved,
      denied,
      pending,
    });
  }

  /**
   * From cases pages, assuming the case has not empty absence history, click on given date.
   * @param {Date} date
   */
  static async clickAbsenceHistoryDate(date) {
    await WDIO.waitUntilDisplayed(cases.selector.absenceHistory.calendar);
    // Calendar days will not be totally ready for clicking yet. First just hover the mouse over a
    // specific day.
    await WDIO.moveTo(cases.selector.absenceHistory.day(date));
    // Now try to wait for calendar popover, which indicates the day is ready to be clicked
    try {
      await WDIO.waitUntilDisplayed(cases.selector.absenceHistory.calendarPopOver);
    } catch (err) {
      // In some cases, the popover could not appear, but as we already have waited for it, the day
      // should be ready for click now, so here we just log and ignore the error
      logger.warn('Calendar popover did not appear');
    }
    // Finally click the specific day, so a modal will appear.
    await WDIO.clickAndRetryIfNotDisplayed(
      async () => WDIO.waitAndClick(cases.selector.absenceHistory.day(date)),
      cases.selector.intermittentRequestModal.selector,
    );
    logger.debug(`Click absence history date ${format(date, DATE_FORMAT)}`);
    await WDIO.waitUntilStopScroll(cases.selector.intermittentRequestModal.date);
  }

  /**
   * Change the polices status setting approved, denied or pending start/end dates.
   * @param {{
   *  approved: {
   *    start: Date,
   *    end: Date
   *  },
   *  denied: {
   *    start: Date,
   *    end: Date,
   *    reason: 'string'
   *  },
   *  pending: {
   *    start: Date,
   *    end: Date
   *  }
   * }} dates dates to be set in polices status form. Undefined/null values will be ignored. No
   * defaults are used.
   */
  static async changePolicesStatus({ approved, denied, pending }) {
    // There is a backend timing issue, where if we try to update polices status right after load
    // the page we can receive an 'Nullable object must have a value' from
    // `POST /Cases/{caseId}/Adjudicate` endpoint. Given that here we add a pause.
    await browser.pause(4000);
    await WDIO.waitUntilTextNotEmpty(cases.selector.caseInfo.caseId);
    await WDIO.waitUntilTextNotEmpty(cases.selector.caseInfo.employeeNumber);
    await WDIO.waitAndClick(cases.selector.changeStatusButton);
    logger.debug('Click change status');

    if (!_.isNil(approved)) {
      await WDIO.setDatepickerValue(cases.selector.policesStatus.approved.start, approved.start);
      await WDIO.setDatepickerValue(cases.selector.policesStatus.approved.end, approved.end);
      logger.debug(
        `Approved: ${format(approved.start, DATE_FORMAT)} - ${format(approved.end, DATE_FORMAT)}`,
      );
    }

    if (!_.isNil(denied)) {
      await WDIO.setDatepickerValue(cases.selector.policesStatus.denied.start, denied.start);
      await WDIO.setDatepickerValue(cases.selector.policesStatus.denied.end, denied.end);
      logger.debug(
        `Denied: ${format(denied.start, DATE_FORMAT)} - ${format(denied.end, DATE_FORMAT)}`,
      );
      await WDIO.selectByVisibleText(cases.selector.policesStatus.denied.denialReason, denied.reason);
      logger.debug(`Select '${denied.reason} 'denied reason`);
    }

    if (!_.isNil(pending)) {
      await WDIO.setDatepickerValue(cases.selector.policesStatus.pending.start, pending.start);
      await WDIO.setDatepickerValue(cases.selector.policesStatus.pending.end, pending.end);
      logger.debug(
        `Pending: ${format(pending.start, DATE_FORMAT)} - ${format(pending.end, DATE_FORMAT)}`,
      );
    }
    await WDIO.waitAndClick(cases.selector.policesStatus.applyStatusButton);
    logger.debug('Click apply status');

    await WDIO.waitUntilNotDisplayed(cases.selector.policesStatus.applyStatusButton);
  }

  /**
   * Get applied policies.
   * @returns {Promise<{
   *  name : string,
   *  startDate : Date,
   *  endDate : Date,
   *  eligibility : string,
   *  caseType : string,
   *  status : string,
   * } | null>}
   */
  static getAppliedPolicies() {
    return this.getPolicies(cases.selector.appliedPolicies);
  }

  /**
   * Get manual policies.
   * @returns {Promise<{
   *  name : string,
   *  startDate : Date,
   *  endDate : Date,
   *  eligibility : string,
   *  caseType : string,
   *  status : string,
   * } | null>}
   */
  static getManualPolicies() {
    return this.getPolicies(cases.selector.manualPolicies);
  }

  /**
   * Get applied policy by name.
   * @param   {string} policyName the name of the policy to be searched.
   * @returns {Promise<{
   *  name : string,
   *  startDate : Date,
   *  endDate : Date,
   *  eligibility : string,
   *  caseType : string,
   *  status : string,
   * } | null>}
   */
  static getAppliedPolicyByName(policyName) {
    return this.getPolicyByName(cases.selector.appliedPolicies, policyName);
  }

  /**
   * Get manual policy by name.
   * @param   {string} policyName the name of the policy to be searched.
   * @returns {Promise<{
   *  name : string,
   *  startDate : Date,
   *  endDate : Date,
   *  eligibility : string,
   *  caseType : string,
   *  status : string,
   * } | null>}
   */
  static getManualPolicyByName(policyName) {
    return this.getPolicyByName(cases.selector.manualPolicies, policyName);
  }

  /**
   * Get policy by name.
   * @param   {string} tableSelector table selector to extract the policies information
   * @param   {string} policyName the name of the policy to be searched.
   * @returns {Promise<{
   *  name : string,
   *  startDate : Date,
   *  endDate : Date,
   *  eligibility : string,
   *  caseType : string,
   *  status : string,
   * }[] | null>}
   */
  static async getPolicyByName(tableSelector, policyName) {
    logger.debug(`Looking for a policy named "${policyName}".`);
    const policies = await this.getPolicies(tableSelector);
    const filteredPolicies = policies.filter((policy) => policy.name === policyName);
    if (filteredPolicies.length === 0) {
      logger.debug(`Policy not found: ${policyName}`);
    }

    if (filteredPolicies.length > 1) {
      logger.debug(`Found multiple policies with the same name: "${policyName}"; retuning the first one`);
    }

    return _.first(filteredPolicies);
  }

  /**
   * Get policies from a policy table.
   * @param   {string} tableSelector table selector to extract the policies information
   * @returns {Promise<{
   *  name : string,
   *  startDate : string,
   *  endDate : string,
   *  eligibility : string,
   *  caseType : string,
   *  status : string,
   * }[]>} an array of objects containing the policy information.
   */
  static async getPolicies(tableSelector) {
    const policyInfoRegex = /(?<name>[\w+|\s]+)\s(?<startDate>\d{2}\/\d{2}\/\d{4})\s+-\s+(?<endDate>\d{2}\/\d{2}\/\d{4})\s+-\s+(?<eligibility>((Eligible)|(Not Eligible)|(Illegible)))\s*((?<caseType>\w+)\s(\d{2}\/\d{2}\/\d{4})\s+-\s+(\d{2}\/\d{2}\/\d{4})\s(?<status>\w+))?/gm;
    await WDIO.waitUntilTextNotEmpty(cases.selector.caseInfo.caseId);
    await WDIO.waitUntilTextNotEmpty(cases.selector.caseInfo.employeeNumber);
    try {
      await WDIO.waitUntilDisplayed(tableSelector, { timeout: 2000 });
    } catch (err) {
      logger.warn('Error waiting for polices, consider empty');
      return [];
    }

    const rows = await WDIO.getTextForAllTreeItems(tableSelector);
    const policies = rows
      .map((row) => [...row.matchAll(policyInfoRegex)][0].groups);
    logger.debug(`Found policies: "${JSON.stringify(policies)}"`);
    return policies;
  }

  /**
   * Get case external policies. Should be on case page.
   * @returns {Promise<{
   *  policyName?: string,
   *  timeUsed?: string,
   *  claimStatus?: string,
   *  segments?: {
   *    startDate: string,
   *    thruDate: string,
   *    status: string
   *  }[]
   * }[]>}
   */
  static async getExternalPolicies() {
    try {
      await WDIO.waitUntilDisplayed(cases.selector.externalPolicies.section, { timeout: 2000 });
    } catch (err) {
      logger.debug('Error while waiting for external policies to appear, consider empty');
      return [];
    }

    const externalPolicies = [];
    const externalPoliciesItems = await $$(cases.selector.externalPolicies.items);

    for (const item of externalPoliciesItems) {
      const externalPolicy = {};
      const lines = await item.$$('./div');
      // name and time used
      const firstLine = await lines[0];
      const firstLineColumns = await firstLine.$$('./div');
      externalPolicy.policyName = await firstLineColumns[0].getText();
      externalPolicy.timeUsed = (await firstLineColumns[1].getText()).replace('Time Used:', '').trim();

      // claim status
      const secondLine = await lines[1];
      externalPolicy.claimStatus = (await secondLine.getText()).replace('Claim Status:', '').trim();

      // segments
      if (lines.length > 2) {
        externalPolicy.segments = [];

        for (let i = 2; i < lines.length; i++) {
          const segmentElement = await lines[i];
          const segment = {};
          const segmentColumns = await segmentElement.$$('./div');
          const dates = (await segmentColumns[0].getText()).split('-');
          segment.startDate = dates[0].trim();
          segment.thruDate = dates[1].trim();
          segment.status = await segmentColumns[1].getText();
          externalPolicy.segments.push(segment);
        }
      }

      externalPolicies.push(_.omitBy(externalPolicy, _.isEmpty));
    }

    logger.debug(`Get external policies: "${JSON.stringify(externalPolicies)}"`);

    return externalPolicies;
  }

  static async reopenCase(status) {
    const today = new Date();
    const futureDate = addDays(today, 5);
    await WDIO.waitAndClick(cases.selector.reopenCase.button);
    logger.debug('Clicks the Reopen Case button');
    if (status === 'relapsed') {
      await WDIO.waitUntilDisplayed(cases.selector.reopenCase.button);
      await WDIO.waitAndClick(cases.selector.reopenCase.popupYesButton);
      logger.debug('Clicks the Yes button in the pop-up Reopen Case Modal');
      await WDIO.waitUntilStopScroll(essCases.selector.duration.start);
      await WDIO.setDatepickerValue(essCases.selector.duration.start, futureDate);
      logger.debug(`Set reopen case start date: ${format(futureDate, DATE_FORMAT)}`);
      await WDIO.setDatepickerValue(essCases.selector.duration.end, futureDate);
      logger.debug(`Set reopen case end date: ${format(futureDate, DATE_FORMAT)}`);
      await WDIO.waitAndClick(cases.selector.reopenCase.modalButton);
      logger.debug('Clicks the Reopen Case button in the pop-up Reopen Case Modal');
      await WDIO.waitUntilStopScroll();
      await WDIO.waitAndClick(cases.selector.reopenCase.completeAndUpdateCaseButton);
      logger.debug('Clicks the Complete and Update Case button');
      await WDIO.waitUntilStopScroll();
    } else {
      await WDIO.waitAndClick(cases.selector.reopenCase.popupNoButton);
      await WDIO.waitUntilDisplayed(cases.selector.changeCaseButton);
    }
  }

  /**
   * Gets start and end date and check if one is a holiday.
   * The method will decrement the dates until none of them is a holiday.
   * @param {Date} startDate Start date of an adjudication period.
   * @param {Date} endDate End date of an adjudication period.
   * @returns {Promise<{foundHoliday: boolean, newStartDate: Date}>} The object contains the new
   * dates that will be the same as the input params if none of them is a holiday and a flag
   * indicating if a holiday was found.
   */
  static async checkIfHoliday(startDate, endDate) {
    let foundHoliday = false;
    let decrementDate = true;
    let newStartDate = startDate;
    const newEndDate = endDate;

    while (decrementDate) {
      const elementStartDate = await $(cases.selector.absenceHistory.day(newStartDate));
      const elementEndDate = await $(cases.selector.absenceHistory.day(newEndDate));
      const classNameStartDate = await elementStartDate.getAttribute('class');
      const classNameEndDate = await elementEndDate.getAttribute('class');
      if (!(classNameStartDate.includes('holiday')) && !(classNameEndDate.includes('holiday'))) {
        decrementDate = false;
      } else {
        logger.debug('Holiday found!');
        newStartDate = subDays(newStartDate, 1);
        foundHoliday = true;
      }
    }

    logger.debug(`Following dates are not holidays - ${newStartDate} | ${newEndDate}`);

    return ({
      foundHoliday,
      newStartDate,
    });
  }

  /**
   * Checks if a warning is displayed during case creation, after set the dates, regarding
   * employee working schedule. If the warning is displayed, this method will return its message,
   * otherwise it will return null.
   * @returns {Promise<string | null>} returns the warning message if available or null.
   */
  static async getOutsideWorkScheduleWarningMessage() {
    try {
      await WDIO.waitUntilDisplayed(cases.selector.workSchedule.warningMessage, { timeout: 2000 });
    } catch (err) {
      return null;
    }

    return WDIO.getText(cases.selector.workSchedule.warningMessage);
  }

  /**
   * Click on the link to edit employee work schedule. This link appear when there is a work
   * schedule warning being shown in the page during case creation, after setting start/end dates.
   */
  static async clickEditWorkScheduleLink() {
    await WDIO.waitAndClick(cases.selector.workSchedule.editLink);
    logger.debug('Click edit employee work schedule link inside warning message');
    await WDIO.waitUntilDisplayed(workScheduleEdit.selector.form);
  }
}

module.exports = {
  CasePortal,
};

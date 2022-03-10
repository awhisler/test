const { WDIO } = require('../../../extensions/wdio');
const accommodation = require('./selectors');
const { Logger } = require('../../../service/logger');
const cases = require('../selectors');

const logger = Logger.create('AddAccommodation');

class CaseAccommodation {
  /**
   * Click on one of the available request type options when creating a new administrative case.
   * @param {'Equipment Or Software' | 'Ergonomic Assessment' | 'Leave' | 'Other'| 'Schedule Change'} type Request type
   */
  static async setAdministrativeRequestTypeAccommodationPopup(type) {
    const buttonGroup = ['Equipment Or Software', 'Ergonomic Assessment', 'Leave', 'Other', 'Schedule Change'];

    expect(buttonGroup, `Invalid Case Type ${type}`).to.include(type);

    const buttonGroupIndex = buttonGroup.indexOf(type);

    // Get the button group inputs, where reason type buttons are located. We need to click on parent
    // element, as the inputs themselves will not be clickable.
    await WDIO.clickByIndexParent(accommodation.selector.newAccommodationRequest.popUpRequestTypeButtonGroupInputs, buttonGroupIndex);
  }

  /**
   * Click on one of the available duration options when creating a new case.
   * @param {'Temporary' | 'Permanent'} type Duration type
   */
  static async selectAdministrativeDurationPopUp(type) {
    const buttonGroup = ['Temporary', 'Permanent'];

    expect(buttonGroup, `Invalid Case Type ${type}`).to.include(type);

    const buttonGroupIndex = buttonGroup.indexOf(type);

    // Get the button group inputs, where reason type buttons are located. We need to click on parent
    // element, as the inputs themselves will not be clickable.
    await WDIO.clickByIndexParent(accommodation.selector.newAccommodationRequest.popUpDurationTypeButtonGroupInputs, buttonGroupIndex);
  }

  static async clickAddAccommodationsButton() {
    WDIO.clickByText(cases.selector.reviewPolicies, accommodation.selector.addAccommodationsButton);
    logger.debug('Clicks the Add Accommodations button');
    await WDIO.waitUntilStopScroll();
  }

  static async getAccommodationText() {
    WDIO.clickByText(cases.selector.reviewPolicies, accommodation.selector.addAccommodationsButton);
    logger.debug('Clicks the Add Accommodations button');
    await WDIO.waitUntilStopScroll();
  }

  static async addAccommodation() {
    await WDIO.waitAndClick(accommodation.selector.newAccommodationRequest.workRelatedYes);
    logger.debug('Clicks the Yes on the Is Work Related? button');
    await this.setAdministrativeRequestTypeAccommodationPopup('Ergonomic Assessment');
    logger.debug('Selects the value Other from the Type button selection');
    await this.selectAdministrativeDurationPopUp('Temporary');
    logger.debug('Selects the Value Temporary from the Duration button selection');
    await WDIO.setValue(accommodation.selector.newAccommodationRequest.generalHealthCondition, 'AutomationTest');
    logger.debug('Sets the value AutomationTest in the General Health Condition field');
    await WDIO.setValue(accommodation.selector.newAccommodationRequest.description, 'AutomationTest');
    logger.debug('Sets the value AutomationTest in the Description field');
    await WDIO.waitAndClick(accommodation.selector.newAccommodationRequest.createAccommodationButtonPopup);
    logger.debug('Clicks the Create Accommodation button');
    await WDIO.waitUntilStopScroll();
  }

  static async adjudicateAccommodation(adjudicationInfo) {
    const statusOptions = ['Approved', 'Denied', 'Pending'];
    await WDIO.waitAndClick(accommodation.selector.adjudicateAccommodation.accommodationName);
    if (statusOptions.includes(adjudicationInfo.status)) {
      await WDIO.setDatepickerValue(accommodation.selector.adjudicateAccommodation.accommodationStatus(adjudicationInfo.status, 'StartDate'), adjudicationInfo.startDate);
      await WDIO.setDatepickerValue(accommodation.selector.adjudicateAccommodation.accommodationStatus(adjudicationInfo.status, 'EndDate'), adjudicationInfo.endDate);
      if (adjudicationInfo.status === 'Denied') {
        await WDIO.setValue(accommodation.selector.adjudicateAccommodation.deniedReason, 'Cannot Accommodate');
      }
      await WDIO.waitAndClick(accommodation.selector.adjudicateAccommodation.updateAccommodationButton);
    } else {
      logger.error(`Invalid status selected - '${adjudicationInfo.status}'`);
    }
    logger.debug(`Accommodation ${adjudicationInfo.status}!`);
  }
}

module.exports = {
  CaseAccommodation,
};

const randomstring = require('randomstring');
const { format } = require('date-fns');
const { API_DATE_FORMAT } = require('../../../extensions/constants');

/**
 * Creates the payload for a new case.
 * @param {string} employeeNumber Employee which this case will be created under
 * @param {{
 *  type: 'Consecutive' | 'Intermittent' | 'Reduced' | 'Administrative',
 *  reason: 'Employee Health Condition' | 'Pregnancy/Maternity',
 *  startDate: Date,
 *  endDate: Date
 * }} caseData
 * @returns {object} the result payload used to create a new case using API
 */
function createCasePayload(employeeNumber, {
  type, reason, startDate, endDate,
}) {
  let caseType;

  switch (type) {
    case 'Consecutive':
      caseType = '1';
      break;

    case 'Intermittent':
      caseType = '2';
      break;

    case 'Reduced':
      caseType = '4';
      break;

    case 'Administrative':
      caseType = '8';
      break;

    default:
      caseType = '1';
      break;
  }

  let reasonCode;

  switch (reason) {
    case 'Employee Health Condition':
      reasonCode = 'EHC';
      break;

    case 'Pregnancy/Maternity':
      reasonCode = 'PREGMAT';
      break;

    default:
      reasonCode = 'EHC';
      break;
  }

  return {
    EmployeeNumber: employeeNumber,
    ShortDescription: `Automation ${randomstring.generate(10)}`,
    Summary: 'This is a test, this is only a test',
    CaseType: caseType,
    StartDate: format(startDate, API_DATE_FORMAT),
    EndDate: format(endDate, API_DATE_FORMAT),
    ReasonCode: reasonCode,
    CaseReporter: {
      CompanyName: null,
      ContactTypeCode: null,
      EmployeeNumber: null,
      Title: null,
      FirstName: null,
      LastName: null,
      WorkPhone: null,
    },
    CaseDates: {
      ActualDeliveryDate: null,
      AdoptionDate: null,
      BondingStartDate: null,
      BondingEndDate: null,
      ExpectedDeliveryDate: null,
    },
    CaseFlags: {
      IsWorkRelated: null,
      WillUseBonding: null,
      MedicalComplications: null,
    },
    primaryAssignedTo: null,
  };
}

module.exports = {
  createCasePayload,
};

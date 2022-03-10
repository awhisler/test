const allureReporter = require('@wdio/allure-reporter').default;

const { subDays } = require('date-fns');
const request = require('supertest');
const { createCasePayload } = require('./fixtures/create-case');
const env = require('../../env-urls');
const { Logger } = require('../../service/logger');

const logger = Logger.create('CaseAPI');

class CaseAPI {
  /**
   * Creates a new case using given `token` and `employeeNumber`. To use different employers it is
   * necessary to use `refCode` parameter as well. By default it will create a 'Consecutive' case,
   * with reason 'Employee Health Condition', using as dates `subDays(new Date(), 20)` to
   * `new Date()`.
   * @see {@link createCasePayload}
   * @param {string} token token created using AuthAPI.getAuthToken
   * @param {string} employeeNumber the case will be created using the given Employee ID
   * @param {string} refCode Employer reference code used when it is necessary to create cases in
   * employers different from the default one.
   * @param {{
   *  type: 'Consecutive' | 'Intermittent' | 'Reduced' | 'Administrative',
   *  reason: 'Employee Health Condition' | 'Pregnancy/Maternity',
   *  startDate: Date,
   *  endDate: Date
   * }} caseData additional case data used to customize the created case.
   * @returns
   */
  static async createCase(
    token,
    employeeNumber,
    refCode = 'Automation',
    {
      type = 'Consecutive',
      reason = 'Employee Health Condition',
      startDate = subDays(new Date(), 20),
      endDate = new Date(),
    } = {},
  ) {
    const payload = createCasePayload(employeeNumber, {
      type, reason, startDate, endDate,
    });

    return request(env.caseURL)
      .post(`/cases?employerReferenceCode=${refCode}`)
      .send(payload)
      .set('X-AUTH-TOKEN', token)
      .expect(function (res) {
        if (res.status !== 200) {
          logger.error(`Error to create case: ${JSON.stringify(res.body)}`);
        }
      })
      .expect(200)
      .then((response) => {
        expect(response.body.success).to.be.true;
        const caseId = response.body.data;
        logger.debug(`Case ID: ${caseId}`);
        allureReporter.addAttachment('Case Payload', payload);
        return caseId;
      });
  }
}

module.exports = {
  CaseAPI,
};

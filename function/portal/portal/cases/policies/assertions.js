const _ = require('lodash');

const { format } = require('date-fns');
const { DATE_FORMAT } = require('../../../extensions/constants');

class PolicyAssertions {
  /**
   * Returns a function which will verify if the specified policy exists based on received polices.
   * It can take optional options to check other policies properties.
   * @param {string} policyName
   * @param {object} options
   * @param {Date} [options.requestedStart]
   * @param {Date} [options.requestedEnd]
   * @param {boolean} [options.eligible]
   * @param {boolean} [options.exists]
   * @returns {(policies: {name: string, requestedStart: string, requestedEnd: string, eligible: string}[]) => void}
   */
  static verifyPolicy(policyName, {
    requestedStart, requestedEnd, eligible, exists = true,
  } = {}) {
    return function (policies) {
      const policy = _.find(policies, { name: policyName });
      if (exists === false) {
        expect(policy, `Should not have '${policyName}' policy`).to.be.undefined;
      } else {
        expect(policy, `Should have '${policyName}' policy`).to.not.be.undefined;
      }

      if (_.isDate(requestedStart)) {
        expect(
          policy.requestedStart,
          'Wrong policy start date',
        ).to.be.equal(format(requestedStart, DATE_FORMAT));
      }

      if (_.isDate(requestedEnd)) {
        expect(
          policy.requestedEnd,
          'Wrong policy end date',
        ).to.be.equal(format(requestedEnd, DATE_FORMAT));
      }

      if (_.isBoolean(eligible)) {
        expect(
          policy.eligible,
          `'${policyName}' policy should ${eligible ? '' : 'not'} be eligible`,
        ).to.be.equal(eligible ? 'Yes' : 'No');
      }
    };
  }

  /**
   * Returns a function which will verify if all the specified policies exists based on received polices.
   * It can take optional options to check other policies properties.
   * @param {{
   * name: string,
   * requestedStart: Date | undefined,
   * requestedEnd: Date | undefined,
   * eligible: boolean | undefined,
   * exists: boolean | undefined
   * }[]} expectedPolicies
   * @returns {(policies: {name: string, requestedStart: string, requestedEnd: string, eligible: string}[]) => void}
   */
  static verifyPolicies(expectedPolicies) {
    return function (policies) {
      for (const expectedPolicy of expectedPolicies) {
        const { name, ...expectations } = expectedPolicy;
        PolicyAssertions.verifyPolicy(name, expectations)(policies);
      }
    };
  }

  /**
   * Returns a function which will verify if there aren't any policies.
   * @returns {(policies: {name: string, requestedStart: string, requestedEnd: string, eligible: string}[]) => void}
   */
  static emptyPolicies() {
    return function (policies) {
      expect(policies).to.be.empty;
    };
  }
}

module.exports = {
  PolicyAssertions,
};

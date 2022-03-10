const _ = require('lodash');
const { Logger } = require('../service/logger');

const logger = Logger.create('Assertions');

class Assertions {
  /**
   * Assert that `asyncFunc` will throw an Error. If `withMessage` is set, check if the thrown error
   * message matches.
   * @param {() => Promise} asyncFunc a function which returns a Promise
   * @param {string} withMessage if defined this method will check if the error thrown by
   * `asyncFunc` contains the string from `withMessage`.
   * @throws it will throw an AssertionError if the given function do not throw or
   * the thrown error message do not match `withMessage` parameter
   */
  static async expectToThrowAsync(asyncFunc, withMessage) {
    try {
      await asyncFunc();
    } catch (error) {
      if (_.isString(withMessage)) {
        expect(
          error.message,
          `Expected error '${error}' to include message '${withMessage}'`,
        ).to.include(withMessage);
      }
      logger.debug(`Expected error caught: ${error}`);
      return;
    }

    expect.fail(`Expected ${asyncFunc} to throw`);
  }
}

module.exports = {
  Assertions,
};

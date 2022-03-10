const { format } = require('date-fns');
const _ = require('lodash');
const { Logger } = require('../service/logger');
const { DATE_FORMAT } = require('./constants');

const logger = Logger.create('WDIO');
const DEFAULT_OPTIONS = { timeout: 8000, interval: 50 };

/**
 * Common options accepted by WDIO commands
 * @typedef {Object} WebDriverOptions
 * @property {number} timeout number of milliseconds to wait for condition. Defaults to 8000.
 * @property {number} interval interval in milliseconds to check for condition. Defaults to 50.
 * @property {string} timeoutMsg message to be thrown when condition is not satisfied within timeout
 * @property {boolean} reverse if true it waits for the opposite (default: false)
 */

async function getBoundingClientRect(selector) {
  const item = await $(selector);
  return browser.execute(function (el) {
    return el.getBoundingClientRect();
  }, item);
}

async function checkIsClickable(element) {
  if (!(await element.isClickable())) { await element.waitForClickable(DEFAULT_OPTIONS); }
}

async function waitForSelectHasOption(selector, option) {
  await browser.waitUntil(async function () {
    const items = await $$(selector);
    if (_.isEmpty(items)) { return false; }
    const selectorText = await items[0].getText();
    return !_.isEmpty(selectorText.match(new RegExp(`^\\s*${_.escapeRegExp(option)}\\s*$`, 'm')));
  }, { ...DEFAULT_OPTIONS, timeoutMsg: `Option '${option}' not found for select '${selector}'` });
}

class WDIO {
  static async waitAndClick(selector) {
    const item = await $(selector);
    await checkIsClickable(item);
    await item.click();
  }

  static async scrollIntoView(selector) {
    const item = await $(selector);
    await item.scrollIntoView();
  }

  /**
   * Given a table has infinite scroll, force the load of more content scrolling the table to last
   * element or until reach max number of scrolls defined by `maxScrollCount` parameter. If
   * `maxScrollCount` is not defined, this method will try to scroll the table until the total
   * number of elements do not change anymore, which means there is no more content to be loaded.
   * @param {string} selector selector which returns all elements inside a infinite scroll table.
   * This selector will be used to define if it is necessary to scroll more.
   * @param {number} [maxScrollCount] max number of scrolls to be performed by this method
   * regardless if the table has more elements or not.
   * @returns {Promise<boolean>} returns false if the scroll was interrupted by `maxScrollCount`
   */
  static async scrollUntilTheEnd(selector, maxScrollCount = 5) {
    let currentElements = await $$(selector);
    let oldElements;
    let scrollCount = 0;

    await browser.waitUntil(async function () {
      oldElements = currentElements;
      // Scroll to last element
      await _.last(currentElements).scrollIntoView();
      scrollCount++;

      try {
        // Wait for elements length change
        await browser.waitUntil(async function () {
          currentElements = await $$(selector);
          return oldElements.length !== currentElements.length;
        }, { ...DEFAULT_OPTIONS, timeout: 2000 });
      } catch (err) {
        // Error here means the elements length did not change into 2s, so we will consider that
        // no more content will be loaded. Return true, so the outer waitUntil will end.
        return true;
      }

      // Elements length have changed, so new content was loaded. Check if we have maxScrollCount
      // set. If so, compare to current scrollCount.
      return _.isFinite(maxScrollCount) && scrollCount >= maxScrollCount;
    }, { ...DEFAULT_OPTIONS, timeout: 30000 });

    return oldElements.length === currentElements.length;
  }

  static async clickByIndex(selector, index) {
    await this.waitUntilArrayHasIndex(selector, index);
    const item = await $$(selector)[index];
    await checkIsClickable(item);
    await item.click();
  }

  static async clickByText(selector, text) {
    const item = await $(selector).$(text);
    await checkIsClickable(item);
    await item.click();
  }

  static async assertClickableByText(selector, text) {
    const item = await $(selector).$(text);
    await checkIsClickable(item);
  }

  static async clickByTextParent(selector, text) {
    const parent = await $(selector).$(text).$('..');
    await checkIsClickable(parent);
    await parent.click();
  }

  static async clickParent(selector) {
    const parent = await $(selector).$('..');
    await checkIsClickable(parent);
    await parent.click();
  }

  static async clickByIndexParent(selector, index) {
    await this.waitUntilArrayHasIndex(selector, index);
    const parent = await $$(selector)[index].$('..');
    await checkIsClickable(parent);
    await parent.click();
  }

  static async clickParentByText(selector, text) {
    const parent = await $(selector).$('..').$(text);
    await checkIsClickable(parent);
    await parent.click();
  }

  /**
   * Execute a click action and wait for a selector to be displayed. If it is not displayed, try to
   * click again.
   * @param {() => Promise} clickFunction function to be executed for button/link to be clicked
   * @param {string} toDisplaySelector string selector for element to be displayed after clicking
   * @param {WebDriverOptions} displayOptions options to be passed to `waitUntilDisplayed` method
   */
  static async clickAndRetryIfNotDisplayed(
    clickFunction,
    toDisplaySelector,
    displayOptions,
  ) {
    await clickFunction();

    try {
      await this.waitUntilDisplayed(
        toDisplaySelector,
        { timeout: 2000, ...displayOptions },
      );
    } catch (err) {
      logger.warn(`Error waiting '${toDisplaySelector}', try to click again`);
      await clickFunction();
      await this.waitUntilDisplayed(toDisplaySelector, displayOptions);
    }
  }

  /**
   * Moves the mouse pointer to middle of element. This method checks if the element is clickable
   * before the moving operation be executed.
   * @param {string} selector string selector for element.
   */
  static async moveTo(selector) {
    const item = await $(selector);
    await checkIsClickable(item);
    await item.moveTo();
  }

  /**
   * Drag the source element to target and drop. This method checks if both source and target
   * elements are clickable before executing the operation.
   * @param {string} sourceSelector selector for element which will be dragged
   * @param {string} targetSelector selector for element which will be used for drop
   */
  static async dragAndDrop(sourceSelector, targetSelector) {
    const source = await $(sourceSelector);
    await checkIsClickable(source);
    const target = await $(targetSelector);
    await checkIsClickable(target);
    await source.dragAndDrop(target);
  }

  /**
   * Wait for the given selector to be displayed.
   * @param {string} selector
   * @param {WebDriverOptions} [options]
   */
  static async waitUntilDisplayed(selector, options) {
    const item = await $(selector);
    await item.waitForDisplayed({ ...DEFAULT_OPTIONS, ...options });
  }

  /**
   * Wait for the given selector to be displayed.
   * @param {string} selector
   * @param {int} index of the item
   * @param {WebDriverOptions} [options]
   */
  static async waitUntilDisplayedByIndex(selector, index, options) {
    await this.waitUntilArrayHasIndex(selector, index);
    const item = await $$(selector)[index];
    await item.waitForDisplayed({ ...DEFAULT_OPTIONS, ...options });
  }

  /**
   * Wait for the given selector to not be displayed anymore.
   * @param {string} selector
   * @param {WebDriverOptions} [options]
   */
  static async waitUntilNotDisplayed(selector, options) {
    await this.waitUntilDisplayed(selector, { ...options, reverse: true });
  }

  /**
   * Wait for one of the given selectors to be displayed.
   * @param {string[]} selectors
   * @param {WebDriverOptions} options
   * @returns {Promise<string>} return the displayed selector
   */
  static async waitUntilOneDisplayed(selectors, options) {
    let displayedSelector;

    await browser.waitUntil(async function () {
      for (const selector of selectors) {
        if (await $(selector).isDisplayed()) {
          displayedSelector = selector;
          return true;
        }
      }

      return false;
    }, { ...DEFAULT_OPTIONS, ...options });

    return displayedSelector;
  }

  /**
   * Wait for the selector to have the given index. This method will retrieve all elements returned
   * by selector and check if the required index is present.
   * @param {string} selector selector which is supposed to return 1 or more elements.
   * @param {number} index index position to wait for. The index count starts from position 0.
   */
  static async waitUntilArrayHasIndex(selector, index) {
    let currentLength;

    await browser.waitUntil(
      async function () {
        const items = await $$(selector);
        currentLength = items.length;
        return currentLength > index;
      },
      {
        ...DEFAULT_OPTIONS,
        timeoutMsg: `Error to wait for array to have index ${index}. `
          + `It has currently a length of ${currentLength}.`,
      },
    );
  }

  /**
   * Wait for element stop scrolling. This method uses the element getBoundingClientRect and checks
   * if the y coordinate changes from one iteration to another. If y coordinate does not change in 3
   * consecutive checks, we can consider that the element stopped moving vertically (scroll).
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
   * @param {string} selector element selector. Uses 'body' by default, which is able to detect
   * whole page scrolling.
   */
  static async waitUntilStopScroll(selector = 'body') {
    let previousY;
    let currentY = (await getBoundingClientRect(selector)).y;
    let counter = 0;

    await browser.waitUntil(async function () {
      previousY = currentY;
      currentY = (await getBoundingClientRect(selector)).y;
      counter = (previousY === currentY) ? counter + 1 : 0;

      return counter >= 3;
    }, { ...DEFAULT_OPTIONS, interval: 100 });
  }

  static async waitUntilTextNotEmpty(selector) {
    await browser.waitUntil(async function () {
      const items = await $$(selector);

      if (_.isEmpty(items)) {
        return false;
      }

      const text = await items[0].getText();
      return !_.isEmpty(text);
    }, DEFAULT_OPTIONS);
  }

  static async waitUntilContainsText(selector, input) {
    await browser.waitUntil(async function () {
      const item = await $(selector);
      const text = await item.getText();
      return _.includes(text, input);
    }, DEFAULT_OPTIONS);
  }

  static async getArrayCountBy(selector) {
    const arr = await $$(selector);
    return arr.length;
  }

  static async getText(selector) {
    await this.waitUntilTextNotEmpty(selector);
    const text = (await $(selector)).getText();
    return text;
  }

  static async invisibilityOf(selector) {
    const element = await $(selector);
    await element.waitForExist({ ...DEFAULT_OPTIONS, reverse: true });
  }

  static async getAttribute(selector, attr) {
    const value = (await $(selector)).getAttribute(attr);
    return value;
  }

  /**
   * Get the value of a <textarea>, <select> or text <input> found by given selector. If multiple
   * elements are found via the given selector, an array of values is returned instead. For input
   * with checkbox or radio type use {@link isSelected}.
   * @param {string} selector
   * @returns {Promise<string | string[]>}
   */
  static async getValue(selector) {
    const item = await $(selector);
    return item.getValue();
  }

  /**
   * Check if option or checkbox/radio input is selected or not.
   * @param {string} selector
   * @returns {Promise<boolean>}
   */
  static async isSelected(selector) {
    const item = await $(selector);
    return item.isSelected();
  }

  static async splitStringOnByIndex(text, delimiter, index) {
    const arr = (await text).split(delimiter);
    return arr[index];
  }

  static async goToUrl(url) {
    let localUrl = url;

    if (_.isString(url)) {
      if (!url.startsWith('http')) {
        localUrl = `https://${url}`;
      }

      localUrl = new URL(localUrl);
    }

    logger.debug(`Go to URL: ${localUrl}`);

    await browser.url(localUrl.toString());
  }

  static async addValue(selector, value) {
    const item = await $(selector);
    await checkIsClickable(item);
    await item.addValue(value);
  }

  static async setValue(selector, value) {
    const item = await $(selector);
    await checkIsClickable(item);
    await item.setValue(value);
  }

  /**
   * Set input value.
   * @param {string} selector selector of the component
   * @param {int} index index of the component
   * @param {string} value value
   * @returns {Promise<boolean>}
   */
  static async setValueByIndex(selector, index, value) {
    await this.waitUntilArrayHasIndex(selector, index);
    const item = await $$(selector)[index];
    await checkIsClickable(item);
    await item.setValue(value);
  }

  /**
   * Set a specific date into datepicker input. The format used will be {@link DATE_FORMAT}.
   * This method will send `keyboardEntry` key after setting the date value, so the datepicker will
   * be closed.
   * @param {string} selector CSS/text selector to be used in WDIO pointing to a datepicker input.
   * @param {Date} date Date value to be set to input.
   * @param {'Enter' | 'Escape' | 'Tab' | null} keyboardEntry Key to be sent after inserting the
   * date, so the datepicker could disappear. It is possible to use null, so no key is sent. Use
   * 'Enter' by default.
   */
  static async setDatepickerValue(selector, date, keyboardEntry = 'Enter') {
    await this.setValue(selector, format(date, DATE_FORMAT));

    if (keyboardEntry !== null) {
      await browser.keys(keyboardEntry);
    }
  }

  static async setESSDatepickerValue(selector, date) {
    await WDIO.waitAndClick(selector);
    await browser.keys(format(date, DATE_FORMAT));
    await browser.keys('Tab');
  }

  /**
   * Set a specific duration into input. The value set will be `${hours}h ${minutes}m`.
   * @param {string} selector CSS/text selector to be used in WDIO pointing to a datepicker input.
   * @param {{hours: number, minutes: number}} duration duration to be used. 1h 0m is set by
   * default.
   */
  static async setDurationValue(selector, { hours = 1, minutes = 0 } = {}) {
    await this.setValue(selector, `${hours}h ${minutes}m`);
  }

  /**
   * Set a specific time into input. The value set will be `${hour}:${minute} ${period}`.
   * Sends a `Tab` key after inserting the value, so the time picker will be updated and receive
   * focus.
   * @param {string} selector CSS/text selector to be used in WDIO pointing to a datepicker input.
   * @param {{hour: number, minute: number, period: 'AM' | 'PM'}} time time to be used. 1:00 PM is
   * set by default.
   */
  static async setTimeValue(selector, { hour = 1, minute = 0, period = 'PM' } = {}) {
    await this.setValue(selector, `${hour}:${_.padStart(minute, 2, '0')} ${period}`);
    await browser.keys('Tab');
  }

  static async selectByIndex(selector, index) {
    const item = await $(selector);
    await checkIsClickable(item);
    await item.selectByIndex(index);
  }

  /**
   * Select option with displayed text matching the `text` param.
   * @param {string} selector selector pointing to `<select>` element
   * @param {string} text text of option element to get selected
   */
  static async selectByVisibleText(selector, text) {
    const item = await $(selector);
    await checkIsClickable(item);
    await waitForSelectHasOption(selector, text);
    await item.selectByVisibleText(text);
  }

  /**
   * Select by visible text
   * @param {string} selector selector of the component
   * @param {int} index index of the component
   * @param {string} text text of the option to be selected
   */
  static async selectByIndexAndVisibleText(selector, index, text) {
    await this.waitUntilArrayHasIndex(selector, index);
    const item = await $$(selector)[index];
    await checkIsClickable(item);
    await waitForSelectHasOption(selector, text);
    await item.selectByVisibleText(text);
  }

  /**
   * Get text for all tree items
   * @param {string} selector selector of the components
   * @return {Promise<string[]>}
   */
  static async getTextForAllTreeItems(selector) {
    const components = await $$(selector);
    const promises = components.map((component) => component.getText());
    return Promise.all(promises);
  }

  /**
   * Get table rows
   * @param {string} headerSelector header selector
   * @param {string} cellSelector cell selector
   * @return {object[]}
   */
  static async getTableRows(headerSelector, cellSelector) {
    const headers = await WDIO.getTextForAllTreeItems(headerSelector);
    const cells = await WDIO.getTextForAllTreeItems(cellSelector);

    const chunks = _.chunk(cells, headers.length);
    return _.map(chunks, (chunk) => _.zipObject(headers, chunk));
  }

  /**
   * Slowly adds a value to a text box
   * Only use if you need to add text to an input field slowly 1 letter at a time
   * @param {string} selector
   * @param {string} value
   */
  static async slowAddValue(selector, value) {
    const item = await $(selector);
    await checkIsClickable(item);

    for (let i = 0; i < value.length; i++) {
      await item.addValue(value[i]);
      await browser.pause(300);
    }
  }

  /**
   * Upload a file to an input element on a page.
   * @param {string} selector
   * @param {string} filePath
   */
  static async uploadFile(selector, filePath) {
    const fileUpload = await $(selector);
    await browser.execute(
      (el) => { el.style.display = 'block'; },
      fileUpload,
    );
    await fileUpload.waitForDisplayed();
    await fileUpload.setValue(filePath);
  }

  /**
   * Refresh the browser until `conditionFuncAsync` returns a truthy value. This method will first
   * check the condition and then start to refresh the browser (check, refresh, check, refresh,
   * check, ...). The condition will be checked `retries` times, while the browser will be refreshed
   * `retries` - 1 times.
   * @param {() => Promise} conditionFuncAsync
   * @param {object} options
   * @param {number} options.retries number of times to check the condition. Notice that the browser
   * will be refreshed (`retries` - 1) times. Use 3 by default: check condition, refresh, check
   * condition, refresh, check condition. This number cannot be less than 2.
   * @param {string} options.errorMsg Error message to be used when condition is not satisfied after
   *  all `retries`
   * @throws Error when `conditionFuncAsync` function does not return a truthy value after `retries`
   * tries. It can optionally use `options.errorMsg` as error message.
   */
  static async refreshBrowserUntil(conditionFuncAsync, { retries = 3, errorMsg } = {}) {
    for (let i = _.max([2, retries]); i > 0; i--) {
      const result = await conditionFuncAsync();

      if (result) {
        return;
      }

      if (i !== 1) {
        await browser.refresh();
      } else {
        throw new Error(errorMsg || `Error waiting for condition: ${conditionFuncAsync}`);
      }
    }
  }
}

module.exports = {
  WDIO,
};

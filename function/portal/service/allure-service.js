const allure = require('allure-commandline');
const fs = require('fs');

const DEFAULT_OPTIONS = {
  saveHistory: true,
  autoGenerateOnComplete: true,
};

const saveHistory = function () {
  if (fs.existsSync('./function/service/reports/allure-reports/history')) {
    if (!fs.existsSync('./function/service/reports/allure-results/history')) {
      fs.mkdirSync('./function/service/reports/allure-results/history');
    }
    fs.copyFileSync(
      './function/service/reports/allure-reports/history/categories-trend.json',
      './function/service/reports/allure-results/history/categories-trend.json',
    );
    fs.copyFileSync(
      './function/service/reports/allure-reports/history/duration-trend.json',
      './function/service/reports/allure-results/history/duration-trend.json',
    );
    fs.copyFileSync(
      './function/service/reports/allure-reports/history/history-trend.json',
      './function/service/reports/allure-results/history/history-trend.json',
    );
    fs.copyFileSync(
      './function/service/reports/allure-reports/history/history.json',
      './function/service/reports/allure-results/history/history.json',
    );
    fs.copyFileSync(
      './function/service/reports/allure-reports/history/retry-trend.json',
      './function/service/reports/allure-results/history/retry-trend.json',
    );
  }
};

const generateReport = async function () {
  const generation = allure([
    'generate',
    '--clean',
    '--output', './function/service/reports/allure-reports/',
    './function/service/reports/allure-results/',
  ]);

  return new Promise((resolve, reject) => {
    const generationTimeout = setTimeout(
      () => reject(new Error('Error to generate Allure report: timeout')),
      30000,
    );

    generation.on('exit', function (exitCode) {
      clearTimeout(generationTimeout);

      if (exitCode !== 0) {
        return reject(new Error(`Error to generate Allure report: code=${exitCode}`));
      }

      return resolve();
    });
  });
};

class AllureService {
  constructor(serviceOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...serviceOptions };
  }

  async before(config, capabilities, browser) {
    this.browser = browser;
  }

  async afterTest(test, context, { passed }) {
    if (!passed) {
      await this.browser.takeScreenshot();
    }
  }

  async afterHook(test, context, { passed }) {
    if (!passed) {
      await this.browser.takeScreenshot();
    }
  }

  async onComplete() {
    if (this.options.saveHistory === true) {
      saveHistory();
    }

    if (this.options.autoGenerateOnComplete === true) {
      await generateReport();
    }
  }
}

module.exports = {
  AllureService,
};

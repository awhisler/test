const allureReporter = require('@wdio/allure-reporter').default;
const request = require('supertest');
const { addContactPayload } = require('./fixtures/contact-payloads');
const env = require('../../../env-urls');
const { Logger } = require('../../../service/logger');

const logger = Logger.create('EmployeeAPI');

class ContactAPI {
  static async addContact(token, employeeNum, employeetoAdd, refCode = env.employers.default.referenceCode) {
    return request(env.employeeURL)
      .post(`/employees/${employeeNum}/contacts?employerReferenceCode=${refCode}`)
      .send(employeetoAdd)
      .set('X-AUTH-TOKEN', token)
      .expect(function (res) {
        if (res.status !== 200) {
          logger.error(`Error to add contacts: ${JSON.stringify(res.body)}`);
        }
      })
      .expect(200)
      .then(() => {
        allureReporter.addAttachment('Contacts Payload', addContactPayload(employeetoAdd));
      });
  }
}

module.exports = {
  ContactAPI,
};

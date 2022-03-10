const allureReporter = require('@wdio/allure-reporter').default;

const request = require('supertest');
const employeeWorkschedule = require('./fixtures/employee-workschedule-payloads');
const hoursWorked = require('./fixtures/employee-hoursworked');
const env = require('../../env-urls');
const { Logger } = require('../../service/logger');

const logger = Logger.create('EmployeeAPI');

class EmployeeAPI {
  static async createEmployee(token, employee, refCode = 'Automation') {
    // create employee with a work schedule and FMLA eligible
    return request(env.employeeURL)
      .post(`/employees?employerReferenceCode=${refCode}`)
      .send(employee)
      .set('X-AUTH-TOKEN', token)
      .expect(function (res) {
        if (res.status !== 200) {
          logger.error(`Error to create employee: ${JSON.stringify(res.body)}`);
        }
      })
      .expect(200)
      .then((response1) => {
        expect(response1.body.data).to.equal(employee.number);
        const employeeID = response1.body.data;
        logger.debug(`Employee: {ID: ${employeeID}, Last Name: ${employee.lastName}}`);
        allureReporter.addAttachment('Employee Payload', employee);

        // add hours worked
        return request(env.employeeURL)
          .post(`/employees/${employeeID}/priorhoursworked?employerReferenceCode=${refCode}`)
          .send(hoursWorked.FMLAEligible)
          .set('X-AUTH-TOKEN', token)
          .expect(function (res) {
            if (res.status !== 200) {
              logger.error(`Error to add hours worked: ${JSON.stringify(res.body)}`);
            }
          })
          .expect(200)
          .then((response2) => {
            expect(response2.body.success).to.be.true;
            allureReporter.addAttachment('Employee Hours Worked Payload', hoursWorked.FMLAEligible);

            // add work schedule
            return request(env.employeeURL)
              .post(`/employees/${employeeID}/workschedules/current?employerReferenceCode=${refCode}`)
              .send(employeeWorkschedule.weekly)
              .set('X-AUTH-TOKEN', token)
              .expect(function (res) {
                if (res.status !== 200) {
                  logger.error(`Error to add work schedule: ${JSON.stringify(res.body)}`);
                }
              })
              .expect(200)
              .then((response3) => {
                expect(response3.body.success).to.be.true;
                allureReporter.addAttachment('Employee Work Schedule Payload', employeeWorkschedule.weekly);
                return employeeID;
              });
          });
      });
  }
}

module.exports = {
  EmployeeAPI,
};

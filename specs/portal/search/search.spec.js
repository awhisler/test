const { SearchPortal } = require('../../../function/portal/search/page');
const { LoginPortal } = require('../../../function/portal/login/page');
const { EmployeeAPI } = require('../../../function/api/employee');
const { CaseAPI } = require('../../../function/api/cases');
const { AuthAPI } = require('../../../function/api/auth');
const { employeePayload } = require('../../../function/api/employee/fixtures/create-employee');
const env = require('../../../function/env-urls');

describe('Search', async function () {
  const employeeToCreate = employeePayload(`AutomationFirstName${new Date().getTime()}`, `AutomationLastName${new Date().getTime()}`).female;
  let employeeNumber;
  let caseId;
  let token;

  before('get auth token, create employee and case', async function () {
    token = await AuthAPI.getAuthToken();
    employeeNumber = await EmployeeAPI.createEmployee(token, employeeToCreate);
    caseId = await CaseAPI.createCase(token, employeeNumber);
    await LoginPortal.login();
  });

  it('should search for employee and display results', async function () {
    await SearchPortal.addTermAndSearch(employeeToCreate.lastName);
    const caseResultCount = await SearchPortal.verifySearchResults('case');
    const employeeResultCount = await SearchPortal.verifySearchResults('emp');
    const totalResultCount = caseResultCount + employeeResultCount;
    expect(caseResultCount).to.be.equal(1);
    expect(employeeResultCount).to.be.equal(1);
    expect(totalResultCount).to.be.equal(2);
  });

  it('should display case and employee records when searching by employee last name', async function () {
    await SearchPortal.addTermAndSearch(employeeToCreate.lastName);
    // Case Search Results
    expect(caseId).to.equal(await SearchPortal.returnCaseNumCaseRow());
    expect(`${employeeToCreate.firstName} ${employeeToCreate.lastName}`).to.equal(await SearchPortal.returnEmployeeNameCaseRow());
    expect(employeeNumber).to.equal(await SearchPortal.returnEmployeeNumCaseRow());
    expect(employeeToCreate.info.email).to.equal(await SearchPortal.returnEmployeeEmailCaseRow());

    // Employee Search Results
    expect(`${employeeToCreate.firstName} ${employeeToCreate.lastName}`).to.equal(await SearchPortal.returnEmployeeNameEmpRow());
    expect(employeeNumber).to.equal(await SearchPortal.returnEmployeeNumEmpRow());
    expect(employeeToCreate.info.email).to.equal(await SearchPortal.returnEmployeeEmailEmpRow());
  });

  it('should display case and employee records when searching by employee first name', async function () {
    await SearchPortal.addTermAndSearch(employeeToCreate.firstName);
    // Case Search Results
    expect(caseId).to.equal(await SearchPortal.returnCaseNumCaseRow());
    expect(`${employeeToCreate.firstName} ${employeeToCreate.lastName}`).to.equal(await SearchPortal.returnEmployeeNameCaseRow());
    expect(employeeNumber).to.equal(await SearchPortal.returnEmployeeNumCaseRow());
    expect(employeeToCreate.info.email).to.equal(await SearchPortal.returnEmployeeEmailCaseRow());

    // Employee Search Results
    expect(`${employeeToCreate.firstName} ${employeeToCreate.lastName}`).to.equal(await SearchPortal.returnEmployeeNameEmpRow());
    expect(employeeNumber).to.equal(await SearchPortal.returnEmployeeNumEmpRow());
    expect(employeeToCreate.info.email).to.equal(await SearchPortal.returnEmployeeEmailEmpRow());
  });

  it('should display case and employee records when searching by employee first and last name', async function () {
    await SearchPortal.addTermAndSearch(`${employeeToCreate.firstName} ${employeeToCreate.lastName}`);
    // Case Search Results
    expect(caseId).to.equal(await SearchPortal.returnCaseNumCaseRow());
    expect(`${employeeToCreate.firstName} ${employeeToCreate.lastName}`).to.equal(await SearchPortal.returnEmployeeNameCaseRow());
    expect(employeeNumber).to.equal(await SearchPortal.returnEmployeeNumCaseRow());
    expect(employeeToCreate.info.email).to.equal(await SearchPortal.returnEmployeeEmailCaseRow());

    // Employee Search Results
    expect(`${employeeToCreate.firstName} ${employeeToCreate.lastName}`).to.equal(await SearchPortal.returnEmployeeNameEmpRow());
    expect(employeeNumber).to.equal(await SearchPortal.returnEmployeeNumEmpRow());
    expect(employeeToCreate.info.email).to.equal(await SearchPortal.returnEmployeeEmailEmpRow());
  });

  it('should display case and employee records when searching by employee ID', async function () {
    await SearchPortal.addTermAndSearch(employeeToCreate.number);
    // Case Search Results
    expect(caseId).to.equal(await SearchPortal.returnCaseNumCaseRow());
    expect(`${employeeToCreate.firstName} ${employeeToCreate.lastName}`).to.equal(await SearchPortal.returnEmployeeNameCaseRow());
    expect(employeeNumber).to.equal(await SearchPortal.returnEmployeeNumCaseRow());
    expect(employeeToCreate.info.email).to.equal(await SearchPortal.returnEmployeeEmailCaseRow());

    // Employee Search Results
    expect(`${employeeToCreate.firstName} ${employeeToCreate.lastName}`).to.equal(await SearchPortal.returnEmployeeNameEmpRow());
    expect(employeeNumber).to.equal(await SearchPortal.returnEmployeeNumEmpRow());
    expect(employeeToCreate.info.email).to.equal(await SearchPortal.returnEmployeeEmailEmpRow());
  });

  it('should display case record when searching by case ID', async function () {
    await SearchPortal.addTermAndSearch(caseId);
    // Case Search Results
    expect(caseId).to.equal(await SearchPortal.returnCaseNumCaseRow());
    expect(`${employeeToCreate.firstName} ${employeeToCreate.lastName}`).to.equal(await SearchPortal.returnEmployeeNameCaseRow());
    expect(employeeNumber).to.equal(await SearchPortal.returnEmployeeNumCaseRow());
    expect(employeeToCreate.info.email).to.equal(await SearchPortal.returnEmployeeEmailCaseRow());
  });

  it('should display case and employee records when searching by email', async function () {
    await SearchPortal.addTermAndSearch(employeeToCreate.info.email);
    // Case Search Results
    expect(caseId).to.equal(await SearchPortal.returnCaseNumCaseRow());
    expect(`${employeeToCreate.firstName} ${employeeToCreate.lastName}`).to.equal(await SearchPortal.returnEmployeeNameCaseRow());
    expect(employeeNumber).to.equal(await SearchPortal.returnEmployeeNumCaseRow());
    expect(employeeToCreate.info.email).to.equal(await SearchPortal.returnEmployeeEmailCaseRow());

    // Employee Search Results
    expect(`${employeeToCreate.firstName} ${employeeToCreate.lastName}`).to.equal(await SearchPortal.returnEmployeeNameEmpRow());
    expect(employeeNumber).to.equal(await SearchPortal.returnEmployeeNumEmpRow());
    expect(employeeToCreate.info.email).to.equal(await SearchPortal.returnEmployeeEmailEmpRow());
  });

  it('should display case and employee records when searching by employee last name using starts with (2 characters)', async function () {
    await SearchPortal.addTermAndSearch(employeeToCreate.info.email);
    // Case Search Results
    expect(caseId).to.equal(await SearchPortal.returnCaseNumCaseRow());
    expect(`${employeeToCreate.firstName} ${employeeToCreate.lastName}`).to.equal(await SearchPortal.returnEmployeeNameCaseRow());
    expect(employeeNumber).to.equal(await SearchPortal.returnEmployeeNumCaseRow());
    expect(employeeToCreate.info.email).to.equal(await SearchPortal.returnEmployeeEmailCaseRow());

    // Employee Search Results
    expect(`${employeeToCreate.firstName} ${employeeToCreate.lastName}`).to.equal(await SearchPortal.returnEmployeeNameEmpRow());
    expect(employeeNumber).to.equal(await SearchPortal.returnEmployeeNumEmpRow());
    expect(employeeToCreate.info.email).to.equal(await SearchPortal.returnEmployeeEmailEmpRow());
  });
});

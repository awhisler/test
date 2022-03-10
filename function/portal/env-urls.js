module.exports = { // process.env.environment options: dev1, dev2, dev3, test1, test2
  portal: `https://dev1.absencesoft.io/`,
  caseURL: `https://case.dev1.absencesoft-api.io/api/v1`,
  employeeURL: `https://employee.dev1.absencesoft-api.io/api/v1`,
  authURL: `https://auth.dev1.absencesoft-api.io`,
  ess: `https://dev1.ess-absencesoft.io/`,
  region: 'us-west-2',
  employers: {
    default: {
      name: 'Test Contact',
      referenceCode: 'TestContact',
    },
    workflow: {
      name: 'Automation WorkflowTest',
      referenceCode: '4234',
    },
  },
  loginInfo: {
    default: {
      username: `qa@absencesoft.com`,
      password: `!Complex001`,
    },
  },
};

const randomstring = require('randomstring');

const email = (`automation${randomstring.generate(4)}@absencesoft.io`).toLowerCase(); // add random characters to have a unique email
function employeePayload(firstName = `AutomationFirstName${new Date().getTime()}`, lastName = `AutomationLastName${new Date().getTime()}`, workState = 'CO') {
  const employeeID = randomstring.generate(10);

  return {
    female: {
      number: employeeID,
      firstName,
      middleName: '',
      lastName,
      dateOfBirth: '1985-07-29',
      militaryStatus: 1,
      gender: 'F',
      ssn: '',
      info: {
        email,
        address: {
          address1: '1234 Add1',
          address2: 'Add2',
          city: 'San Francisco',
          state: 'CA',
          country: 'US',
          postalCode: '99933',
        },
        altAddress: {
          address1: '1234 Alt Add1',
          address2: 'AltAdd2',
          city: 'Cincinnati',
          state: 'OH',
          country: 'US',
          postalCode: '45020',
        },
        workPhone: '5139998888',
        homePhone: '5139998887',
        cellPhone: '5139998886',
        altPhone: '5139998885',
        officeLocation: 'null',
      },
      workCountry: 'US',
      workState,
      workCounty: 'Jefferson',
      workCity: 'Golden',
      costCenterCode: 'null',
      meets50In75MileRule: true,
      hireDate: '2009-05-26',
      rehireDate: null,
      terminationDate: null,
      serviceDate: '2009-05-26',
      payType: 1,
      salary: 80001,
      isExempt: false,
      workType: 1,
      isKeyEmployee: false,
      payScheduleId: '000000000000000000000002',
      status: 65,
      spouseEmployeeNumber: null,
      department: 'null',
      isFlightCrew: false,
      residenceCounty: 'rescounty',
    },
  };
}

module.exports = {
  employeePayload,
};

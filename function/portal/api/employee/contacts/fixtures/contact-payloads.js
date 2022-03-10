function addContactPayload(type, contactEmployeeNum, firstName, lastName) {
  return {
    contactTypeCode: type,
    relatedEmployeeNumber: contactEmployeeNum,
    contact: {
      title: type,
      firstName,
      lastName,
      address: {
        address1: '1234 test drive',
        city: 'denver',
        state: 'co',
        country: 'usa',
        postalCode: '80203',
      },
    },
  };
}

module.exports = {
  addContactPayload,
};

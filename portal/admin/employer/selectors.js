module.exports = {
  selector: {
    companyName: '#Name',
    refCode: '#ReferenceCode',
    address: '#Address',
    address2: '#Address2',
    city: '#City',
    country: '#Country',
    state: '#State',
    postalCode: '#PostalCode',
    phoneNumber: '#PhoneNumber',
    faxNumber: '#Fax',
    workHours: '#WeeklyWorkHours',
    saveEmployerBtn: '#employerSaveForm',
    configurations: {
      button: '.dropdown-toggle=Configurations',
      dropdown: '#configurationDropdown',
      link: (config) => `a=${config}`,
      communicationsOption: 'a[href*="/templates/listcommunications/"]',
    },
  },
};

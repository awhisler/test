module.exports = {
  selector: {
    addEmployerLink: '#employers a[href="/administration/new"]',
    usersLink: '#administrationSidebar a[href="/user/list"]',
    documentAdmin: '#administrationSidebar a[href="/administration/viewdocumentsinbox"]',
    employersLink: '#administrationSidebar a[href="#employers"]',
    employerList: '#employers  .employer-administration',
    employerListItem: (name) => `.employer-link*=${name}`,
    addLink: '#employers a[href="/administration/new"]',
  },
};

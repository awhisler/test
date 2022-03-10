module.exports = {
  selector: {
    casesHeader: '#cases .case-header',
    toDoItems: '#scrollTodoCtr > div',
    employeeItems: 'div#employees .row.scroll > div > div',
    caseItems: 'div#cases .row.scroll > div > div',
    employeesNameFilterInput: '#empFilters > div:first-child input',
    casesEmployeeFilterInput: '#cases .row-filter > div:first-child input',
    viewAllEmployeesLink: 'a[href="/employees"]',
    dashboardViewItemsDropDown: '.dashboard-header select',
    createEmployee: 'a[href="/Employees/Edit"]',
    toDoSection: {
      items: '#scrollTodoCtr > div',
      textWait: '#todoCtr label',
      filters: {
        employee: '#todoFilters  > div:first-child input',
        toDo: '#todoFilters  > div:nth-child(2) input',
        due: '#todoFilters  > div:nth-child(3) input',
        status: '#todoFilters  > div:nth-child(4) select',
        Assignee: '#todoFilters  > div:nth-child(5) input',
        Employer: '#todoFilters  > div:nth-child(6) select',
      },
    },
    caseCol1: '#cases .large-text-label-with-employer',
  },
};

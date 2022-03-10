module.exports = {
  selector: {
    customFieldList: '.admin2userlist',
    customFieldItems: '.admin2userlink',
    newCustomField: 'a=New Custom Field',
    editCustomField: {
      form: '#editCustomFieldForm',
      name: '#Name',
      code: '#Code',
      description: '#Description',
      helpText: '#HelpText',
      fileOrder: '#FileOrder',
      dataType: '#DataType',
      valueType: '#valueType',
      enterValues: '#newValue',
      appliesTo: {
        cases: '#targetsCase',
        employees: '#TargetsEmployee',
      },
      absenceReasons: {
        input: '#absenceReasonCodesControl input',
        dropdown: '#select2-drop',
        dropdownItem: (item) => `div=${item}`,
      },
      visibilityRules: {
        absenceTracker: {
          collectedAtIntake: '#IsCollectedAtIntake',
          required: '#IsRequired',
        },
        ess: {
          visible: '#IsVisibleInESS',
          collectedAtIntake: '#IsCollectedAtESSIntake',
          required: '#IsRequiredInESS',
        },
      },
      saveChanges: '#editCustomFieldForm input[type="submit"][value="Save Changes"]',
      deleteCustomField: 'a=Delete',
    },
  },
};

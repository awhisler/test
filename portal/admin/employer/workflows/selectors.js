module.exports = {
  selector: {
    newWorkflow: 'a=New Workflow',
    workflowItems: '.admin2userlink',
    editWorkflow: {
      form: '#editWorkflowForm',
      name: '#workflowName',
      code: '#workflowCode',
      eventType: '#targetEventType',
      saveChanges: '#saveWorkflowTemplate',
      designWorkflow: 'a=Design Workflow',
      deleteWorkflow: '#deleteWorkflow',
    },
    designWorkflow: {
      activities: {
        case: {
          dropdownLink: '[href="#CaseActivities"]',
          dropdown: '#CaseActivities.panel.panel-collapse.in',
          items: {
            caseNote: '[jtk-activity-id="CaseNoteActivity"]',
          },
        },
      },
      design: {
        canvas: '#workflow-designer',
        controls: '#workflow-designer .controls',
        nodes: '.jtk-surface-canvas > div',
        editNodes: '.jtk-surface-canvas > div .node-edit.node-action',
        deleteNodes: '.jtk-surface-canvas > div .node-delete.node-action',
        nodeTypes: {
          caseNote: {
            modal: '#dlgCaseNoteActivity',
            note: '#dlgCaseNoteActivity .activity-note-template',
            category: '#dlgCaseNoteActivity .activity-note-category',
            saveChanges: 'button=Save Changes',
          },
        },
        saveChanges: '#saveWorkflowDesign',
      },
    },
  },
};

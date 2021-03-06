module.exports = {
  selector: {
    allToDo: '#todoCtr > div',
    titles: 'div > div',
    dueDate: '#todo-name-and-due-date > div > div > .duedate',
    todayButton: '.pull-center > div > div > button',
    submitButton: '[ng-click="submitToDo()"]',
    reasonTextArea: '.popover-content textarea',
    reasonTextAreaNotEmpty: 'textarea.ng-not-empty',
    toDoStatus: '#todoFilters select',
    toDoStatusSelected: '#todoFilters select > option[selected]',
    addToDoButton: 'button=Add To-Do',
    modalTitle: 'h4=List of To-Do',
    modelToDoPopUp: '#modalToDo',
    manualToDoTitleField: '[ng-model="ManualTodo.Title"]',
    manualToDoDescriptionField: '[ng-model="ManualTodo.Description"]',
    toDoDueDateField: '[ng-model="ManualTodo.DueDate"]',
    manualToDoAddButton: 'button=Add',
    modalAttachment: '[ng-bind="CaseAttachmentReviewModel.Attachment.FileName"]',
    paperworkDueToDo: {
      receivedButton: 'button=Paperwork Received',
      completeWithoutUploadButton: 'button=Complete Without Uploading Paperwork',
    },
    closeCaseToDo: {
      closeCaseButton: 'button=Close Case',
      model: '[name=frmCloseCase]',
      adjMessage: '#view-todo-modal .alert',
      updateCheckbox: '[name="frmCloseCase"] [type="checkbox"]',
      denialReason: '#ddlDenyPolicyReason',
      sendCloseNoticeToDo: 'div*=Send Case Closure Notice',
    },
  },
};

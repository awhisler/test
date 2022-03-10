module.exports = {

  selector: {
    addAccommodationsButton: 'button=Add Accommodations',
    newAccommodationRequest: {
      generalHealthCondition: '[name="AddAccommodationRequestGHC"]',
      description: '[name="AddAccommodationRequestDesc"]',
      workRelatedYes: '#AccomodationIsWorkRelatedTrue',
      workRelatedNo: '#AccomodationIsWorkRelatedFalse',
      popUpRequestTypeButtonGroupInputs: '.modal-body input[name="RequestType"]',
      popUpDurationTypeButtonGroupInputs: '.modal-body input[name="Duration"]',
      createAccommodationButtonPopup: 'button=Create Accommodation',
      text: 'div=Accommodation Request',
    },
    adjudicateAccommodation: {
      cancelCheckBox: '[ng-model="AccomCancellation.IsCancel"]',
      cancelReason: '[ng-model="AccomCancellation.Reason"]',
      cancelButton: 'button=Cancel Accommodation',
      accommodationName: '[data-target="#EditAccommodation"]',
      editAccommodation: 'h4=Edit Accommodation',
      accommodationStatus: (status, date) => `[name="EditAccommodation${status}${date}"]`,
      deniedReason: '[ng-model="EditAccommodation.DenialReasonCode"]',
      updateAccommodationButton: 'button=Update Accommodation',
    },
  },

};

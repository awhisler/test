module.exports = {
  API_DATE_FORMAT: 'yyyy-MM-dd',
  DATE_FORMAT: 'MM/dd/yyyy',
  DATE_FORMAT_SINGLE_DIGITS: 'M/d/yyyy',
  ESS_CASE_INFO_REGEX: {
    nameAndNumberAndStatus: /^(.*) CASE NUMBER #(.*) (.*)$/m,
    startAndEndDates: /^DATES: (.*) - (.*)$/m,
    reason: /^REASON: (.*)$/m,
    returnDate: /^RETURN TO WORK: (.*)$/m,
    type: /^TYPE: (.*)$/m,
    allCustomFields: /Custom Fields\n((?:.+:\n.+\n)+)/,
    eachCustomField: /(.+):\n(.+)\n/g,
  },
};

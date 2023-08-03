module.exports = {
  WRITEKEY: undefined, // can also pass in query string (e.g. ?writeKey=1234)
  ONE_TRUST_OPTIONS: {
    integrationCategoryMappings: {
      Fullstory: ['C0001', 'NO_MATCH'],
      'Braze Web Mode (Actions)': ['C0004', 'C0003'],
    },
  },
}

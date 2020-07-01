(function () {
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = {
      baselineImplementation: getDamerauLevenshteinEditDistance
    }
  }
})();
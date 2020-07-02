/// <reference path="baseline-dl.ts" />
/// <reference path="baseline-iterative-dl.ts" />
/// <reference path="diagonalized-iterative-dl.ts" />

(function () {
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = {
      baselineImplementation: getDamerauLevenshteinEditDistance,
      firstIterativeImplementation: BaselineIterativeDamerauLevenshteinCalculation,
      secondIterativeImplementation: DiagonalizedIterativeDamerauLevenshteinCalculation
    }
  }
})();
// This implementation is based heavily upon the "Distance with adjacent transpositions" pseudocode
// found at https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance.

class EditDistanceCalculationBuffer {
  resolvedDistances: number[][]

  constructor(rows: number, cols: number) {
    // The goal is to generate a buffer like this:
    // MAX | MAX | MAX | MAX | MAX | ...
    // MAX |  0  |  1  |  2  |  3  | ...
    // MAX |  1  |
    // MAX |  2  |
    // MAX |  3  |
    // ... | ... |
    //
    // Transpositions from the outermost entries should be impossible, and
    // are thus set to MAX cost.
    // 
    // The second layer reflects the cost of deleting characters from a string's start
    // in order to align it with the other string.
    //
    // The first undefined layer (so, layer 3, index 2) will reflect the costs for matching 
    // the first character of one string against a character from the other.
    
    let distBuffer = [];

    rows += 2;
    cols += 2;

    distBuffer[0] = Array(cols).fill(Number.MAX_VALUE);

    distBuffer[1] = Array(cols);
    distBuffer[1][0] = [Number.MAX_VALUE];
    for(let c = 1; c < cols; c++) {
      distBuffer[1][c] = c-1;
    }

    // All other rows
    for(let r = 2; r < rows; r++) {
      distBuffer[r] = [Number.MAX_VALUE, r-1];
    }
    
    this.resolvedDistances = distBuffer;
  }

  getCostAt(i: number, j: number): number {
    return this.resolvedDistances[i+2][j+2];
  }

  setCostAt(i: number, j: number, cost: number) {
    this.resolvedDistances[i+2][j+2] = cost;
  }
}

function getDamerauLevenshteinEditDistance(str: string, other: string): number {
  // Corresponds to 'da' in the original pseudocode.
  let charLastPositionInStr: {[char: string]: number} = {}
  
  // init dynamic programming buffer
  let resolvedDistances = new EditDistanceCalculationBuffer(str.length, other.length);

  // do the actual edit distance computations.
  for(let r = 0; r < str.length; r++) {
    let lastPositionInOther: number = -1;
    for(let c = 0; c < other.length; c++) {
      let substitutionEditCost = 1;

      let prevIndexOfOtherCharInStr = charLastPositionInStr[other.charAt(c)] || -1;
      let prevIndexOfStrCharInOther = lastPositionInOther;
      // Assumes one JS-char per actual char.  (No SMP support)
      if(str.charAt(r) == other.charAt(c)) {
        lastPositionInOther = c;
        substitutionEditCost = 0;
      }

      let substitutionCost  = resolvedDistances.getCostAt(r-1, c-1) + substitutionEditCost;
      let insertionCost     = resolvedDistances.getCostAt(r, c-1) + 1;
      let deletionCost      = resolvedDistances.getCostAt(r-1, c) + 1;

      let k = prevIndexOfOtherCharInStr;
      let l = prevIndexOfStrCharInOther;
      
      // Allows multiple chained (or, "adjacent") transpositions.  "abc" -> "cab" = costs 2, as "c" is moved two characters
      // and is thus actually moved twice.  ("abc" => "acb" => "cab")
      let transpositionCost = resolvedDistances.getCostAt(k-1, l-1) + (r - k - 1) + 1 + (c - l - 1);

      resolvedDistances.setCostAt(r, c, Math.min(substitutionCost, insertionCost, deletionCost, transpositionCost));
    }

    charLastPositionInStr[str.charAt(r)] = r;
  }

  // return the result.
  return resolvedDistances.getCostAt(str.length -1, other.length - 1);
}

(function () {
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = getDamerauLevenshteinEditDistance;
  }
})();
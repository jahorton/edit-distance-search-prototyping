// A semi-optimized proof-of-concept 'online'/iterative Damerau-Levenshtein calculator with the following features:
// - may add new character to the 'input' string or to the 'match' string, reusing all old calculations efficiently.
// - allows a 'focused' evaluation that seeks if the edit distance is within a specific range.  Designed for use in match-searching,
//   where we want to find the 'closest' matching strings in a lexicon.
// - towards such a match-searching algorithm/heuristic: should nothing be found within that range, all prior calculations may be reused
//   to search across the lexicon with an incremented edit distance.
// - minimized memory footprint: O(m) memory footprint (where m = length of 'input' string), rather than O(mn) (where n = length of 'match' string)
//   - guaranteed to use a smaller footprint than DiagonalizedIterativeDamerauLevenshteinCalculation.
//
// In short:  Used to optimize calculations for low edit-distance checks, then expanded if/as necessary
//            if a greater edit distance is requested.
//
// Reference: https://en.wikipedia.org/wiki/Wagner%E2%80%93Fischer_algorithm#Possible_modifications
//    - Motivating statement:  "if we are only interested in the distance if it is smaller than a threshold..."  
class SparsifiedIterativeDamerauLevenshteinCalculation {
  /**
   * Stores ONLY the computed diagonal elements, nothing else.
   * 
   * Mapped as seen in the example below (with a diagonal of width 1):
   * ```
   * MAX | MAX | MAX | MAX | MAX | ...
   * MAX |  0  |  1  |  2  |  3  | ...        >
   * MAX |  1  |  a  |  b  |  -  | ...    ====>>    |  -  |  a  |  b  |
   * MAX |  2  |  c  |  d  |  e  | ...        >     |  c  |  d  |  e  |
   * MAX |  3  |  -  |  f  |  g  | ...              |  f  |  g  | ... |
   * ... | ... | ... | ... | ... | ...              | ... | ... | ... |
   * ```
   * 
   * Any "`-`" entries are undefined, as they lie outside of the diagonal under consideration.
   * 
   * Things of note:
   * - The entry where row index = col index will always lie at the center of the row's array.
   * - For each +1 increase in row index, the row's entries are (logically) shifted by -1 in order to make this happen.
   * - As all of the MAX entries and numerical entries above are fixed, known values, they are not represented here.
   */
  resolvedDistances: number[][];
  /**
   * Specifies how far off-diagonal calculations should be performed.  A value of 0 only evaluates cells with matching 
   * row and column indicies.
   * 
   * The resulting value from .getFinalCost() is only guaranteed correct if it is less than or equal to this value.
   * Otherwise, this object represents a heuristic that _may_ overestimate the true edit distance.  Note that it will
   * never underestimate.
   */
  diagonalWidth: number = 1;

  // The sequence of characters input so far.
  inputSequence: string[] = [];
  matchSequence: string[] = [];

  constructor();
  constructor(other: SparsifiedIterativeDamerauLevenshteinCalculation);
  constructor(other?: SparsifiedIterativeDamerauLevenshteinCalculation) {    
    if(other) {
      // Clone class properties.
      let rowCount = other.resolvedDistances.length;
      this.resolvedDistances = Array(rowCount);

      for(let r = 0; r < rowCount; r++) {
        this.resolvedDistances[r] = Array.from(other.resolvedDistances[r]);
      }

      this.inputSequence = Array.from(other.inputSequence);
      this.matchSequence = Array.from(other.matchSequence);
      this.diagonalWidth = other.diagonalWidth;
    } else { 
      this.resolvedDistances = [];
    }
  }

  private getTrueIndex(r: number, c: number, width: number): {row: number, col: number, sparse: boolean} {
    let retVal = {
      row: r,
      col: c - r + width,
      sparse: false
    }

    if(retVal.col < 0 || retVal.col > 2 * width) {
      retVal.sparse = true;
    }

    return retVal;
  }

  private getCostAt(i: number, j: number, width: number = this.diagonalWidth): number {
    // Check for and handle the set of fixed-value virtualized indices.
    if(i < 0 || j < 0) {
      if(i == -1 && j >= -1) {
        return j+1;
      } else if(j == -1 && i >= -1) {
        return i+1;
      }

      return Number.MAX_VALUE;
    }

    let index = this.getTrueIndex(i, j, width);
    return index.sparse ? Number.MAX_VALUE : this.resolvedDistances[index.row][index.col];
  }

  /**
   * Noting the above link's statement prefixed "By examining diagonals instead of rows, and by using lazy evaluation...",
   * this function will return the actual edit distance between the strings, temporarily increasing the computed
   * diagonal's size if necessary.
   * 
   * Does not actually mutate the instance.
   */
  getFinalCost(): number {
    let buffer = this as SparsifiedIterativeDamerauLevenshteinCalculation;
    let val = buffer.getHeuristicFinalCost();

    while(val > buffer.diagonalWidth) {
      // A consequence of treating this class as immutable.
      buffer = buffer.increaseMaxDistance();
      val = buffer.getHeuristicFinalCost();
    }

    return val;
  }

  /**
   * Returns this instance's computed edit distance.  If greater than the diagonal's width value, note that it may be an overestimate.
   */
  getHeuristicFinalCost(): number {
    return this.getCostAt(this.inputSequence.length-1, this.matchSequence.length-1);
  }

  /**
   * Returns `true` if the represented edit distance is less than or equal to the specified threshold, minimizing the amount of calculations
   * needed to meet the specified limit.
   * 
   * Does not mutate the instance.
   * @param threshold 
   */
  hasFinalCostWithin(threshold: number): boolean {
    let buffer = this as SparsifiedIterativeDamerauLevenshteinCalculation;
    let val = buffer.getHeuristicFinalCost();
    let guaranteedBound = this.diagonalWidth;

    do {
      if(val <= threshold) {
        return true;
      } else if(guaranteedBound < threshold) {
        buffer = buffer.increaseMaxDistance();
        guaranteedBound++;
        val = buffer.getHeuristicFinalCost();
      } else if(guaranteedBound > Math.max(this.inputSequence.length, this.matchSequence.length)) {
        // In case of excessively-high thresholds, we simply note that the final cost can never exceed
        // the length of the longer input sequence.  (Substitute all characters, then insert / delete
        // to reach the length of the longer string.)
        return false;
      } else {
        break;
      }
    } while(true);

    return false;
  }

  private static initialCostAt(buffer: SparsifiedIterativeDamerauLevenshteinCalculation, r: number, c: number, insertCost?: number, deleteCost?: number) {
    var baseSubstitutionCost = buffer.inputSequence[r] == buffer.matchSequence[c] ? 0 : 1;
    var substitutionCost: number = buffer.getCostAt(r-1, c-1) + baseSubstitutionCost;
    var insertionCost: number = insertCost || buffer.getCostAt(r, c-1) + 1; // If set meaningfully, will never equal zero.
    var deletionCost: number = deleteCost || buffer.getCostAt(r-1, c) + 1;  // If set meaningfully, will never equal zero.
    var transpositionCost: number = Number.MAX_VALUE

    if(r > 0 && c > 0) { // bypass when transpositions are known to be impossible.
      // Transposition checks
      let lastInputIndex = buffer.inputSequence.lastIndexOf(buffer.matchSequence[c], r-1);
      let lastMatchIndex = buffer.matchSequence.lastIndexOf(buffer.inputSequence[r], c-1);
      transpositionCost = buffer.getCostAt(lastInputIndex-1, lastMatchIndex-1) + (r - lastInputIndex - 1) + 1 + (c - lastMatchIndex - 1);
    }

    return Math.min(substitutionCost, deletionCost, insertionCost, transpositionCost);
  }

  // Inputs add an extra row / first index entry.
  addInputChar(char: string): SparsifiedIterativeDamerauLevenshteinCalculation {
    let returnBuffer = new SparsifiedIterativeDamerauLevenshteinCalculation(this);
    
    let r = returnBuffer.inputSequence.length;
    returnBuffer.inputSequence.push(char);

    // Insert a row, even if we don't actually do anything with it yet.
    // Initialize all entries with Number.MAX_VALUE, as `undefined` use leads to JS math issues.
    let row = Array(2 * returnBuffer.diagonalWidth + 1).fill(Number.MAX_VALUE);
    returnBuffer.resolvedDistances[r] = row;

    // If there isn't a 'match' entry yet, there are no values to compute.  Exit immediately.
    if(returnBuffer.matchSequence.length == 0) {
      return returnBuffer;
    }

    let c = returnBuffer.diagonalWidth - r; // position of first (virtual) column entry within the row
    c = c < 0 ? 0 : c; // devirtualizes the entry.
    let cMax = returnBuffer.matchSequence.length - r - 1 + returnBuffer.diagonalWidth; // position of the row's last (virtual) column entry, as indexed within the diagonal.
    // devirtualizes the bound, ensures the max index lies within the 'diagonal'.
    cMax = (cMax > 2 * returnBuffer.diagonalWidth) ? 2 * returnBuffer.diagonalWidth : cMax;

    for(; c <= cMax; c++) {
      // What is the true (virtual) index represented by this entry in the diagonal?
      let trueColIndex = c + r - returnBuffer.diagonalWidth;

      row[c] = SparsifiedIterativeDamerauLevenshteinCalculation.initialCostAt(returnBuffer, r, trueColIndex);
    }

    return returnBuffer;
  }

  addMatchChar(char: string): SparsifiedIterativeDamerauLevenshteinCalculation {
    let returnBuffer = new SparsifiedIterativeDamerauLevenshteinCalculation(this);
    
    let c = returnBuffer.matchSequence.length;
    returnBuffer.matchSequence.push(char);

    // If there isn't a 'match' entry yet, there are no values to compute.  Exit immediately.
    if(returnBuffer.inputSequence.length == 0) {
      return returnBuffer;
    }

    let r = c - returnBuffer.diagonalWidth; // position of first (virtualized) row within the resolvedDistances data structure.
    r = r < 0 ? 0 : r; // devirtualizes the entry (no working with row -1)
    let rMax = returnBuffer.inputSequence.length - 1; // position of the col's last (virtual) row entry.
    // devirtualizes the bound, ensures the max index lies within the 'diagonal'.
    rMax = (rMax > c + returnBuffer.diagonalWidth) ? c + returnBuffer.diagonalWidth : rMax;

    for(; r <= rMax; r++) {
      let cIndexInRow = c - r + this.diagonalWidth;
      
      var row = returnBuffer.resolvedDistances[r];
      row[cIndexInRow] = SparsifiedIterativeDamerauLevenshteinCalculation.initialCostAt(returnBuffer, r, c);
    }

    return returnBuffer;
  }

  public increaseMaxDistance(): SparsifiedIterativeDamerauLevenshteinCalculation {
    let returnBuffer = new SparsifiedIterativeDamerauLevenshteinCalculation(this);
    returnBuffer.diagonalWidth++;

    if(returnBuffer.inputSequence.length < 1 || returnBuffer.matchSequence.length < 1) {
      return returnBuffer;
    }

    // An abstraction of the common aspects of transposition handling during diagonal extensions.
    function forPossibleTranspositionsInDiagonal(startPos: number, fixedChar: string, lookupString: string[], closure: (axisIndex: number, diagIndex: number) => void) {
      let diagonalCap = 2 * (returnBuffer.diagonalWidth - 1);  // The maximum diagonal index permitted
      let axisCap = lookupString.length - 1;   // The maximum index supported by the axis of iteration

      // Ensures that diagonal iteration only occurs within the axis's supported range
      diagonalCap = diagonalCap < axisCap - startPos ? diagonalCap : axisCap - startPos;

      // Iterate within the diagonal and call our closure for any potential transpositions.
      for(let diagonalIndex = 0; diagonalIndex <= diagonalCap; diagonalIndex++) {
        if(fixedChar == lookupString[startPos + diagonalIndex]) {
          closure(startPos + diagonalIndex, diagonalIndex);
        }
      }
    }

    for(let r = 0; r < returnBuffer.inputSequence.length; r++) {
      let leftCell = Number.MAX_VALUE;
      let c = r - returnBuffer.diagonalWidth // External index of the left-most entry, which we will now calculate.
      if(c >= 0) {
        // If c == 0, cell is at edge, thus a known value for insertions exists.
        // Base cost: r+1, +1 for inserting.
        let insertionCost = c == 0 ? r + 2 : Number.MAX_VALUE;
        // compute new left cell
        leftCell = SparsifiedIterativeDamerauLevenshteinCalculation.initialCostAt(returnBuffer, r, c, insertionCost, undefined);
        let addedCost = leftCell;

        // daisy-chain possible updates

        // cell (r, c+1):  new insertion source
        if(c < returnBuffer.matchSequence.length-1) {
          // We propagate the new added cost (via insertion) to the old left-most cell, which is one to our right.
          SparsifiedIterativeDamerauLevenshteinCalculation.propagateUpdateFrom(returnBuffer, r, c+1, addedCost+1, 0);

          // Only possible if insertions are also possible AND more conditions are met.
          // cells (r+2, * > c+2):  new transposition source
          let transposeRow = r+2;
          if(r+2 < this.inputSequence.length) { // Row to check for transposes must exist.
            let rowChar = returnBuffer.inputSequence[r+1];
            // First possible match in input could be at index c + 2, which adjusts col c+2's cost.  Except that entry in r+2
            // doesn't exist yet - so we start with c+3 instead.
            forPossibleTranspositionsInDiagonal(c + 3, rowChar, returnBuffer.matchSequence, function(axisIndex, diagIndex) {
              // Because (r+2, c+3) is root, not (r+2, c+2).  Min cost of 2.
              SparsifiedIterativeDamerauLevenshteinCalculation.propagateUpdateFrom(returnBuffer, transposeRow, axisIndex, addedCost + diagIndex + 2, diagIndex);
            });
          }
        }
      }

      let rightCell = Number.MAX_VALUE;
      c = r + returnBuffer.diagonalWidth;
      if(c < returnBuffer.matchSequence.length) {
        // If r == 0, cell is at edge, thus a known value for insertions exists.
        // Base cost: c+1, +1 for inserting.
        let deletionCost = r == 0 ? c + 2 : Number.MAX_VALUE;

        // the current row wants to use adjusted diagonal width; we must specify use of the old width & its mapping instead.
        var insertionCost: number = returnBuffer.getCostAt(r, c-1, this.diagonalWidth) + 1;

        // compute new right cell
        rightCell = SparsifiedIterativeDamerauLevenshteinCalculation.initialCostAt(returnBuffer, r, c, insertionCost, deletionCost);
        let addedCost = rightCell;

        // daisy-chain possible updates

        // cell (r+1, c):  new deletion source
        if(r < returnBuffer.inputSequence.length - 1) {
          // We propagate the new added cost (via deletion) to the old right-most cell, which is one to our right.
          SparsifiedIterativeDamerauLevenshteinCalculation.propagateUpdateFrom(returnBuffer, r+1, c, addedCost + 1, 2 * this.diagonalWidth);

          // Only possible if deletions are also possible AND more conditions are met.
          // cells(* > r+2, c+2): new transposition source
          let transposeCol = c+2;
          if(c+2 < this.matchSequence.length) { // Row to check for transposes must exist.
            let colChar = returnBuffer.matchSequence[r+1];
            // First possible match in input could be at index r + 2, which adjusts row r+2's cost.  Except that entry in c+2
            // doesn't exist yet - so we start with r+3 instead.
            forPossibleTranspositionsInDiagonal(r+3, colChar, returnBuffer.inputSequence, function(axisIndex, diagIndex) {
              let diagColIndex = 2 * (returnBuffer.diagonalWidth - 1) - diagIndex;
              // Because (r+3, c+2) is root, not (r+2, c+2).  Min cost of 2.
              SparsifiedIterativeDamerauLevenshteinCalculation.propagateUpdateFrom(returnBuffer, axisIndex, transposeCol, addedCost + diagIndex + 2, diagColIndex);
            });
          }
        }
      }
      
      // Constructs the final expanded diagonal for the row.
      returnBuffer.resolvedDistances[r] = [leftCell].concat(returnBuffer.resolvedDistances[r], rightCell);
    }

    return returnBuffer;
  }

  private static propagateUpdateFrom(buffer: SparsifiedIterativeDamerauLevenshteinCalculation, r: number, c: number, value: number, diagonalIndex: number) {
    // Note:  this function does not actually need the `c` parameter!
    //        That said, it's very useful when tracing stack traces & debugging.
    if(value < buffer.resolvedDistances[r][diagonalIndex]) {
      buffer.resolvedDistances[r][diagonalIndex] = value;
    } else {
      return
    }

    let internalRow = r < buffer.inputSequence.length - 1;
    let internalCol = c < buffer.matchSequence.length - 1;

    // We have to compensate for the current & following rows not having been expanded yet.
    if(diagonalIndex < 2 * (buffer.diagonalWidth - 1) && internalCol) {
      // We've inserted to the left of an existing calculation - check for propagation via insertion.
      let updateCost = value + 1;
      this.propagateUpdateFrom(buffer, r, c+1, updateCost, diagonalIndex+1);
    }

    if(diagonalIndex > 0 && internalRow) {
      // We've inserted above an existing calculation - check for propagation via deletion
      let updateCost = value + 1
      this.propagateUpdateFrom(buffer, r+1, c, updateCost, diagonalIndex-1);
    }

    // If both, check for propagation via substitution
    if(internalRow && internalCol) {
      let updateCost = value + (buffer.inputSequence[r+1] == buffer.matchSequence[c+1] ? 0 : 1);
      this.propagateUpdateFrom(buffer, r+1, c+1, updateCost, diagonalIndex);
    }

    // Propagating transpositions
    let nextInputIndex = buffer.inputSequence.indexOf(buffer.matchSequence[c+1], r+2);
    let nextMatchIndex = buffer.matchSequence.indexOf(buffer.inputSequence[r+1], c+2);

    if(nextInputIndex > 0 && nextMatchIndex > 0) {
      let transpositionCost = value + (nextInputIndex - r - 2) + 1 + (nextMatchIndex - c - 2);
      this.propagateUpdateFrom(buffer, nextInputIndex, nextMatchIndex, transpositionCost, (buffer.diagonalWidth - 1) + nextMatchIndex - nextInputIndex);
    }
  }
}
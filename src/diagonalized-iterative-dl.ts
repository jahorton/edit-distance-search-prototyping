// Not exactly optimized, but a proof-of-concept 'online'/iterative Damerau-Levenshtein calculator with the following features:
// - may add new character to the 'input' string or to the 'match' string, reusing all old calculations efficiently.
// - allows a 'focused' evaluation that seeks if the edit distance is within a specific range.  Designed for use in match-searching,
//   where we want to find the 'closest' matching strings in a lexicon.
// - towards such a match-searching algorithm/heuristic: should nothing be found within that range, all prior calculations may be reused
//   to search across the lexicon with an incremented edit distance.
//
// In short:  Used to optimize calculations for low edit-distance checks, then expanded if/as necessary
//            if a greater edit distance is requested.
//
// Reference: https://en.wikipedia.org/wiki/Wagner%E2%80%93Fischer_algorithm#Possible_modifications
//    - Motivating statement:  "if we are only interested in the distance if it is smaller than a threshold..."  
class DiagonalizedIterativeDamerauLevenshteinCalculation {
  // Want a possibly-better-optimized version where we don't allocate empty/unreferenced array space?
  // See the "sparsified" variant @ sparsified-iterative-dl.ts!
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
  constructor(other: DiagonalizedIterativeDamerauLevenshteinCalculation);
  constructor(other?: DiagonalizedIterativeDamerauLevenshteinCalculation) {
    // The goal is to maintain a buffer like this:
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
      // Initialize from scratch.
      let distBuffer = [];
      distBuffer[0] = [Number.MAX_VALUE, Number.MAX_VALUE];
      distBuffer[1] = [Number.MAX_VALUE, 0];
      
      // The rest of the buffer may then be built progressively. 
      this.resolvedDistances = distBuffer;
    }
  }

  private getCostAt(i: number, j: number): number {
    let val = this.resolvedDistances[i+2][j+2];
    return val === undefined ? Number.MAX_VALUE : val;
  }

  /**
   * Noting the above link's statement prefixed "By examining diagonals instead of rows, and by using lazy evaluation...",
   * this function will return the actual edit distance between the strings, temporarily increasing the computed
   * diagonal's size if necessary.
   * 
   * Does not actually mutate the instance.
   */
  getFinalCost(): number {
    let buffer = this as DiagonalizedIterativeDamerauLevenshteinCalculation;
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
    let buffer = this as DiagonalizedIterativeDamerauLevenshteinCalculation;
    let val = buffer.getHeuristicFinalCost();
    let guaranteedBound = this.diagonalWidth;

    do {
      if(val <= threshold) {
        return true;
      } else if(guaranteedBound < threshold) {
        buffer = buffer.increaseMaxDistance();
        guaranteedBound++;
        val = buffer.getHeuristicFinalCost();
      } else {
        break;
      }
    } while(true);

    return false;
  }

  // Inputs add an extra row / first index entry.
  addInputChar(char: string): DiagonalizedIterativeDamerauLevenshteinCalculation {
    let returnBuffer = new DiagonalizedIterativeDamerauLevenshteinCalculation(this);
    // True index within the buffer
    let r = returnBuffer.inputSequence.length;
    let rowIndex = r + 2;

    // The first input char == row index 2, and the second column should be assigned a 1 - deletion of that single char to match an empty string.
    returnBuffer.resolvedDistances[this.resolvedDistances.length] = [Number.MAX_VALUE, rowIndex - 1];
    
    returnBuffer.inputSequence.push(char);

    // Compute necessary diagonal band range
    let startCol = r - returnBuffer.diagonalWidth;
    startCol = startCol >= 0 ? startCol : 0
    let endCol = r + returnBuffer.diagonalWidth + 1;  // +1 for simple '<' bounds check in for-loop.
    endCol = endCol >= returnBuffer.matchSequence.length ? returnBuffer.matchSequence.length : endCol;

    for(let c = startCol; c < endCol; c++) {
      let colIndex = c + 2;
      returnBuffer.resolvedDistances[rowIndex][colIndex] = returnBuffer.computeValue(r, c);
    }

    return returnBuffer;
  }

  addMatchChar(char: string): DiagonalizedIterativeDamerauLevenshteinCalculation {
    let returnBuffer = new DiagonalizedIterativeDamerauLevenshteinCalculation(this);
    // True index within the buffer
    let c = this.matchSequence.length;
    let colIndex = c + 2;

    // The first match char == col index 2.
    returnBuffer.resolvedDistances[0][colIndex] = Number.MAX_VALUE;
    returnBuffer.resolvedDistances[1][colIndex] = colIndex - 1;

    returnBuffer.matchSequence.push(char);

    // Compute necessary diagonal band range.
    let startRow = c - returnBuffer.diagonalWidth;
    startRow = startRow >= 0 ? startRow : 0
    let endRow = c + returnBuffer.diagonalWidth + 1; //  +1 for simple '<' bounds check in for-loop.
    endRow = endRow >= returnBuffer.inputSequence.length ? returnBuffer.inputSequence.length : endRow;

    for(let r = startRow; r < endRow; r++) {
      let rowIndex = r + 2;
      returnBuffer.resolvedDistances[rowIndex][colIndex] = returnBuffer.computeValue(r, c);
    }

    return returnBuffer;
  }

  // Used by addInputChar and addMatchChar.
  private computeValue(r: number, c: number) {
    let inputChar = this.inputSequence[r];
    let matchChar = this.matchSequence[c];

    //console.log("conputeValue(r: " + r + " = " + inputChar + ", c:" + c + " = " + matchChar + ")");

    // Find the closest set of indices that could correspond to a transition, if they exist.
    let lastInputIndex = r > 0 ? this.inputSequence.lastIndexOf(matchChar, r-1) : -1;
    let lastMatchIndex = c > 0 ? this.matchSequence.lastIndexOf(inputChar, c-1) : -1;

    // Build the set of potential costs.
    let substitutionCost  = this.getCostAt(r-1, c-1) + (inputChar == matchChar ? 0 : 1);
    let insertionCost     = this.getCostAt(r, c-1) + 1;
    let deletionCost      = this.getCostAt(r-1, c) + 1;
    
    // Allows multiple chained (or, "adjacent") transpositions.  "abc" -> "cab" = costs 2, as "c" is moved two characters
    // and is thus actually moved twice.  ("abc" => "acb" => "cab")    
    let transpositionCost = this.getCostAt(lastInputIndex-1, lastMatchIndex-1) + (r - lastInputIndex - 1) + 1 + (c - lastMatchIndex - 1);

    return Math.min(substitutionCost, insertionCost, deletionCost, transpositionCost);
  }

  public increaseMaxDistance(): DiagonalizedIterativeDamerauLevenshteinCalculation {
    let returnBuffer = new DiagonalizedIterativeDamerauLevenshteinCalculation(this);
    returnBuffer.diagonalWidth++;

    for(let r = 0; r < returnBuffer.inputSequence.length; r++) {
      // Expanding the diagonal means placing a new cell at this column within this row.
      let rightCellCol = r + returnBuffer.diagonalWidth
      if(rightCellCol < returnBuffer.matchSequence.length) {
        // New cell position is valid; compute its value!
        let addedCost = returnBuffer.computeValue(r, rightCellCol);
        returnBuffer.resolvedDistances[r+2][rightCellCol+2] = addedCost;

        // Is there a cell to update beneath it?
        if(r + 1 < returnBuffer.inputSequence.length) {
         let updatedDeletionCost = addedCost + 1;
         DiagonalizedIterativeDamerauLevenshteinCalculation.propagateUpdateFrom(returnBuffer, r+1, rightCellCol, updatedDeletionCost, 2 * this.diagonalWidth);
        }

        // Are transpositions possible?  This block will iterate over the cells where this is possible, given the just-updated cell.
        let transposeCol = rightCellCol + 2;
        if(transposeCol < returnBuffer.matchSequence.length) {
          // colChar in col col+1, but was transposed with the char at col+2.
          let colChar = returnBuffer.matchSequence[rightCellCol+1];
          // First possible match in input could be at index r + 2, which adjusts row r+2's cost.  Except that entry in c+2
          // doesn't exist yet - so we start with r+3 instead.
          let startOffset = r+3;

          // We have a variable row index, fixed column index.  Only one may vary for transpositions; otherwise, we can find cheaper through other edit types.
          // Calculate the number of valid entries within the diagonal - only these are updatable.  (The excluded ones from the 'new diagonal' don't exist yet.)
          let rowCap = 2 * this.diagonalWidth + 1;
          rowCap = (rowCap < returnBuffer.inputSequence.length - startOffset) ? rowCap: (returnBuffer.inputSequence.length - startOffset);
          for(let diagRow = r + 3; diagRow < rowCap; diagRow++) {
            let transposeRow = diagRow + startOffset;
            if(returnBuffer.inputSequence[transposeRow] == colChar) {
              // update time!  Note that the col's contribution to the cost is always 0 here.
              let updatedTranspositionCost = addedCost + diagRow + 2;  // Because (r+3, c+2) is root, not (r+2, c+2).

              let diagIndex = this.diagonalWidth - (transposeRow - transposeCol);
              DiagonalizedIterativeDamerauLevenshteinCalculation.propagateUpdateFrom(returnBuffer, transposeRow, transposeCol, updatedTranspositionCost, diagIndex);
            }
          }
        }
      }

      let leftCellCol = r - returnBuffer.diagonalWidth;
      if(leftCellCol >= 0) {
        // New cell position is valid; compute its value!
        let addedCost = returnBuffer.computeValue(r, leftCellCol);
        returnBuffer.resolvedDistances[r+2][leftCellCol+2] = addedCost;

        // The cell to the right will (fortunately) always exist.
        let updatedInsertionCost = addedCost + 1;
        DiagonalizedIterativeDamerauLevenshteinCalculation.propagateUpdateFrom(returnBuffer, r, leftCellCol+1, updatedInsertionCost, 0);

        // Are transpositions possible?  This block will iterate over the cells where this is possible, given the just-updated cell.
        let transposeRow = r + 2;
        if(transposeRow < returnBuffer.inputSequence.length) {
          // rowChar on row r+1, but was transposed with the char at row+2.
          let rowChar = returnBuffer.inputSequence[r+1];
          // First possible match in input could be at index leftCellCol + 2, which adjusts col leftCellCol+2's cost.  Except that entry in r+2
          // doesn't exist yet - so we start with leftCellCol+3 instead.
          let startOffset = leftCellCol+3;

          // We have a fixed row index, variable column index.  Only one may vary for transpositions; otherwise, we can find cheaper through other edit types.
          // Calculate the number of valid entries within the old diagonal - only these are updatable.  (The excluded ones from the 'new diagonal' don't exist yet.)
          let colCap = 2 * this.diagonalWidth + 1;
          colCap = (colCap < returnBuffer.matchSequence.length - startOffset) ? colCap: (returnBuffer.matchSequence.length - startOffset);
          for(let diagCol = 0; diagCol < colCap; diagCol++) {
            let transposeCol = diagCol + startOffset;
            if(returnBuffer.matchSequence[transposeCol] == rowChar) {
              // update time!  Note that the row's contribution to the cost is always 0 here.
              let updatedTranspositionCost = addedCost + diagCol + 2;  // Because (r+2, c+3) is root, not (r+2, c+2).
              DiagonalizedIterativeDamerauLevenshteinCalculation.propagateUpdateFrom(returnBuffer, transposeRow, transposeCol, updatedTranspositionCost, diagCol);
            }
          }
        }
      }
    }
    return returnBuffer;
  }

  private static propagateUpdateFrom(buffer: DiagonalizedIterativeDamerauLevenshteinCalculation, r: number, c: number, value: number, diagonalIndex: number) {
    if(value < buffer.resolvedDistances[r+2][c+2]) {
      buffer.resolvedDistances[r+2][c+2] = value;
      console.log("Update @ (" + r + ", " + c + "), diag index " + diagonalIndex);
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
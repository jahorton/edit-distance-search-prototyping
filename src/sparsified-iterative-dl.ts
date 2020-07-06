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
    let val = index.sparse ? undefined : this.resolvedDistances[index.row][index.col];
    
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
    let buffer = this as SparsifiedIterativeDamerauLevenshteinCalculation;
    let val = buffer.getHeuristicFinalCost();
    // TODO:  revert comment-out op seen below... once increaseMaxDistance is adjusted properly.
    // while(val > buffer.diagonalWidth) {
    //   console.log(val);
    //   // A consequence of treating this class as immutable.
    //   buffer = buffer.increaseMaxDistance();
    //   val = buffer.getHeuristicFinalCost();
    // }

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
      } else {
        break;
      }
    } while(/*true*/ false); // TODO:  revert once increaseMaxDistance is adjusted properly.

    return false;
  }

  // Inputs add an extra row / first index entry.
  addInputChar(char: string): SparsifiedIterativeDamerauLevenshteinCalculation {
    let returnBuffer = new SparsifiedIterativeDamerauLevenshteinCalculation(this);
    
    let r = returnBuffer.inputSequence.length;
    returnBuffer.inputSequence.push(char);

    // Insert a row, even if we don't actually do anything with it yet.
    let row = Array(2 * returnBuffer.diagonalWidth + 1);
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

    let firstEntry = true;
    for(; c <= cMax; c++) {
      // What is the true (virtual) index represented by this entry in the diagonal?
      let trueColIndex = c + r - returnBuffer.diagonalWidth;

      var baseSubstitutionCost = returnBuffer.inputSequence[r] == returnBuffer.matchSequence[trueColIndex] ? 0 : 1;
      var substitutionCost: number = returnBuffer.getCostAt(r-1, trueColIndex-1) + baseSubstitutionCost;
      var insertionCost: number = returnBuffer.getCostAt(r, trueColIndex-1) + 1;
      var deletionCost: number = returnBuffer.getCostAt(r-1, trueColIndex) + 1;
      let transpositionCost: number = Number.MAX_VALUE;

      if(r > 0 && trueColIndex > 0) { // bypass when transpositions are known to be impossible.
        // Transposition checks
        let lastInputIndex = r > 0 ? this.inputSequence.lastIndexOf(returnBuffer.matchSequence[trueColIndex], r-1) : -1;
        let lastMatchIndex = c > 0 ? this.matchSequence.lastIndexOf(returnBuffer.inputSequence[r], trueColIndex-1) : -1;
        transpositionCost = this.getCostAt(lastInputIndex-1, lastMatchIndex-1) + (r - lastInputIndex - 1) + 1 + (trueColIndex - lastMatchIndex - 1);
      }

      row[c] = Math.min(substitutionCost, deletionCost, insertionCost, transpositionCost);

      firstEntry = false;
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

    let firstEntry = true;
    for(; r <= rMax; r++) {
      let cIndexInRow = c - r + this.diagonalWidth;
      
      var row = returnBuffer.resolvedDistances[r];

      // Fortunately, r IS the true row index.  This'll be easier than addInputChar's variation.
      var baseSubstitutionCost = (returnBuffer.inputSequence[r] == returnBuffer.matchSequence[c]) ? 0 : 1;
      var substitutionCost: number = returnBuffer.getCostAt(r-1, c-1) + baseSubstitutionCost;
      var insertionCost: number = returnBuffer.getCostAt(r, c-1) + 1;
      var deletionCost: number = returnBuffer.getCostAt(r-1, c) + 1;
      let transpositionCost: number = Number.MAX_VALUE;

      if(r > 0 && c > 0) { // bypass when transpositions are known to be impossible.
        // Transposition checks
        let lastInputIndex = r > 0 ? this.inputSequence.lastIndexOf(returnBuffer.matchSequence[c], r-1) : -1;
        let lastMatchIndex = c > 0 ? this.matchSequence.lastIndexOf(returnBuffer.inputSequence[r], c-1) : -1;
        transpositionCost = this.getCostAt(lastInputIndex-1, lastMatchIndex-1) + (r - lastInputIndex - 1) + 1 + (c - lastMatchIndex - 1);
      }

      row[cIndexInRow] = Math.min(substitutionCost, insertionCost, deletionCost, transpositionCost);

      firstEntry = false;
    }

    return returnBuffer;
  }

  // TODO:  Massively overhaul.
  public increaseMaxDistance(): SparsifiedIterativeDamerauLevenshteinCalculation {
    let returnBuffer = new SparsifiedIterativeDamerauLevenshteinCalculation(this);
    returnBuffer.diagonalWidth++;

    if(returnBuffer.inputSequence.length < 1 || returnBuffer.matchSequence.length < 1) {
      return returnBuffer;
    }

    // Currently under development.
    for(let r = 0; r < returnBuffer.inputSequence.length; r++) {
      let leftCell = Number.MAX_VALUE;
      let c = r - returnBuffer.diagonalWidth // External index of the left-most entry, which we will now calculate.
      if(c >= 0) {
        // compute new left cell
        var baseSubstitutionCost = (returnBuffer.inputSequence[r] == returnBuffer.matchSequence[c]) ? 0 : 1;
        var substitutionCost: number = returnBuffer.getCostAt(r-1, c-1) + baseSubstitutionCost; // previous rows already use adjusted diagonal width.
        var insertionCost: number = Number.MAX_VALUE;
        var deletionCost: number = returnBuffer.getCostAt(r-1, c) + 1;
        var transpositionCost: number = Number.MAX_VALUE;
  
        if(c==0) { // cell is at edge, thus a known value for insertions exists.
          // Base cost: r+1, +1 for inserting.
          insertionCost = r + 2;
        } else {
          // Transposition checks.  Only possible if there exists at least one (true) column before the current cell.
          let lastInputIndex = r > 0 ? this.inputSequence.lastIndexOf(returnBuffer.matchSequence[c], r-1) : -1;
          let lastMatchIndex = c > 0 ? this.matchSequence.lastIndexOf(returnBuffer.inputSequence[r], c-1) : -1;
          transpositionCost = this.getCostAt(lastInputIndex-1, lastMatchIndex-1) + (r - lastInputIndex - 1) + 1 + (c - lastMatchIndex - 1);
        }

        let addedCost = Math.min(substitutionCost, insertionCost, deletionCost, transpositionCost);
        leftCell = addedCost;

        // daisy-chain possible updates

        // cell (r, c+1):  new insertion source
        if(c < returnBuffer.matchSequence.length-1) {
          // We propagate the new added cost (via insertion) to the old left-most cell, which is one to our right.
          returnBuffer.resolvedDistances[r][0] = Math.min(returnBuffer.resolvedDistances[r][0], addedCost+1);
        }

        // cells (r+2, * >= c+2):  new transposition source
      }

      let rightCell = Number.MAX_VALUE;
      c = r + returnBuffer.diagonalWidth;
      if(c < returnBuffer.matchSequence.length) {
        // compute new right cell
        var baseSubstitutionCost = (returnBuffer.inputSequence[r] == returnBuffer.matchSequence[c]) ? 0 : 1;
        var substitutionCost: number = returnBuffer.getCostAt(r-1, c-1) + baseSubstitutionCost;
        // the current row wants to use adjusted diagonal width; we must specify use of the old width & its mapping instead.
        var insertionCost: number = returnBuffer.getCostAt(r, c-1, this.diagonalWidth) + 1; 

        // Conditionally possible.
        var deletionCost: number = Number.MAX_VALUE;
        var transpositionCost: number = Number.MAX_VALUE;
  
        // Only one of the two costs may actually be assigned.
        if(r == 0) { // cell is at edge, thus a known value for insertions exists.
          // Base cost: c+1, +1 for inserting.
          deletionCost = c + 2;
        } else {
          // Transposition checks.  Only possible if there exists at least one (true) row before the current cell.
          let lastInputIndex = r > 0 ? this.inputSequence.lastIndexOf(returnBuffer.matchSequence[c], r-1) : -1;
          let lastMatchIndex = c > 0 ? this.matchSequence.lastIndexOf(returnBuffer.inputSequence[r], c-1) : -1;
          transpositionCost = this.getCostAt(lastInputIndex-1, lastMatchIndex-1) + (r - lastInputIndex - 1) + 1 + (c - lastMatchIndex - 1);
        }

        let addedCost = Math.min(substitutionCost, insertionCost, deletionCost, transpositionCost);
        rightCell = addedCost;

        // daisy-chain possible updates

        // cell (r+1, c):  new deletion source
        if(r < returnBuffer.inputSequence.length) {
          // We propagate the new added cost (via deletion) to the old right-most cell, which is one to our right.
          returnBuffer.resolvedDistances[r+1][2 * this.diagonalWidth] = Math.min(returnBuffer.resolvedDistances[r+1][2 * this.diagonalWidth], addedCost+1);
        }

        // cells(* >= r+2, c+2): new transposition source
      }
      
      // Constructs the final expanded diagonal for the row.
      returnBuffer.resolvedDistances[r] = [leftCell].concat(returnBuffer.resolvedDistances[r], rightCell);
    }

    return returnBuffer;

    // for(let r = 0; r < returnBuffer.inputSequence.length; r++) {
    //   // Expanding the diagonal means placing a new cell at this column within this row.
    //   let rightCellCol = r + returnBuffer.diagonalWidth
    //   if(rightCellCol < returnBuffer.matchSequence.length) {
    //     // New cell position is valid; compute its value!
    //     let addedCost = returnBuffer.computeValue(r, rightCellCol);
    //     returnBuffer.resolvedDistances[r+2][rightCellCol+2] = addedCost;

    //     // Is there a cell to update beneath it?
    //     if(r + 1 < returnBuffer.inputSequence.length) {
    //      let updatedDeletionCost = addedCost + 1;
    //      returnBuffer.resolvedDistances[r+3][rightCellCol+2] = Math.min(updatedDeletionCost, returnBuffer.getCostAt(r+1, rightCellCol));
    //     }

    //     // Are transpositions possible?  This block will iterate over the cells where this is possible, given the just-updated cell.
    //     let transposeCol = rightCellCol + 2;
    //     if(transposeCol < returnBuffer.matchSequence.length) {
    //       // colChar in col col+1, but was transposed with the char at col+2.
    //       let colChar = returnBuffer.matchSequence[rightCellCol+1];
    //       // First possible match in input could be at index r + 2, which adjusts row r+2's cost.  Fixed column index, variable row index.
    //       let rowCap = transposeCol + returnBuffer.diagonalWidth;  // Compute diagonal for the fixed column index.
    //       rowCap = rowCap < returnBuffer.inputSequence.length ? rowCap : returnBuffer.inputSequence.length;
    //       for(let transposeRow = r + 2; transposeRow < rowCap; transposeRow++) {
    //         if(returnBuffer.inputSequence[transposeRow] == colChar) {
    //           // update time!  Note that the col's contribution to the cost is always 0 here.
    //           let updatedTranspositionCost = addedCost + (transposeRow - (r+1) - 1) /* row shift count */ + 1;
    //           returnBuffer.resolvedDistances[transposeRow+2][transposeCol+2] = Math.min(returnBuffer.getCostAt(transposeRow, transposeCol), updatedTranspositionCost)
    //         }
    //       }
    //     }
    //   }

    //   let leftCellCol = r - returnBuffer.diagonalWidth;
    //   if(leftCellCol >= 0) {
    //     // New cell position is valid; compute its value!
    //     let addedCost = returnBuffer.computeValue(r, leftCellCol);
    //     returnBuffer.resolvedDistances[r+2][leftCellCol+2] = addedCost;

    //     // The cell to the right will (fortunately) always exist.
    //     let updatedInsertionCost = addedCost + 1;
    //     returnBuffer.resolvedDistances[r+2][leftCellCol+3] = Math.min(updatedInsertionCost, returnBuffer.getCostAt(r, leftCellCol+1));

    //     // Are transpositions possible?  This block will iterate over the cells where this is possible, given the just-updated cell.
    //     let transposeRow = r + 2;
    //     if(transposeRow < returnBuffer.inputSequence.length) {
    //       // rowChar on row r+1, but was transposed with the char at row+2.
    //       let rowChar = returnBuffer.inputSequence[r+1];
    //       // First possible match in input could be at index leftCellCol + 2, which adjusts col leftCellCol+2's cost.
    //       // Fixed row index, variable column index.
    //       let colCap = transposeRow + returnBuffer.diagonalWidth; // Compute diagonal for the fixed row index.
    //       colCap = colCap < returnBuffer.matchSequence.length ? colCap : returnBuffer.matchSequence.length;
    //       for(let transposeCol = leftCellCol + 2; transposeCol < colCap; transposeCol++) {
    //         if(returnBuffer.matchSequence[transposeCol] == rowChar) {
    //           // update time!  Note that the row's contribution to the cost is always 0 here.
    //           let updatedTranspositionCost = addedCost + (transposeCol - (leftCellCol + 1) - 1) /* col shift count */ + 1;
    //           returnBuffer.resolvedDistances[transposeRow+2][transposeCol+2] = Math.min(returnBuffer.getCostAt(transposeRow, transposeCol), updatedTranspositionCost);
    //         }
    //       }
    //     }
    //   }
    // }
    //return returnBuffer;
  }
}
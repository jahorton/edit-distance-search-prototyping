// WARNING:  Extremely rough and unoptimized.
//           Presently very incomplete.
//
// Basis:    Used to optimize calculations for low edit-distance checks, then expanded if/as necessary
//           if a greater edit distance is merited (as determined externally)
//
// Reference: https://en.wikipedia.org/wiki/Wagner%E2%80%93Fischer_algorithm
//    - Possible modification:  "if we are only interested in the distance if it is smaller than a threshold..."  
class DiagonalizedIterativeDamerauLevenshteinCalculation {
  resolvedDistances: number[][];
  // 1:  computes the diagonal cells + 1 cell on each side of the diagonal, corresponding to 
  //     the formulation in the link above.
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

  getCostAt(i: number, j: number): number {
    let val = this.resolvedDistances[i+2][j+2];
    return val === undefined ? Number.MAX_VALUE : val;
  }

  getFinalCost() {
    return this.getCostAt(this.inputSequence.length-1, this.matchSequence.length-1);
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
         returnBuffer.resolvedDistances[r+3][rightCellCol+2] = Math.min(updatedDeletionCost, returnBuffer.getCostAt(r+1, rightCellCol));
        }

        // TODO:  compute now-possible transpositions.
      }

      let leftCellCol = r - returnBuffer.diagonalWidth;
      if(leftCellCol >= 0) {
        // New cell position is valid; compute its value!
        let addedCost = returnBuffer.computeValue(r, leftCellCol);
        returnBuffer.resolvedDistances[r+2][leftCellCol+2] = addedCost;

        // The cell to the right will (fortunately) always exist.
        let updatedInsertionCost = addedCost + 1;
        returnBuffer.resolvedDistances[r+2][leftCellCol+3] = Math.min(updatedInsertionCost, returnBuffer.getCostAt(r, leftCellCol+1));

        // TODO:  compute now-possible transpositions.
      }
    }
    return returnBuffer;
  }
}
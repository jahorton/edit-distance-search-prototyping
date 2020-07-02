class BaselineIterativeDamerauLevenshteinCalculation {
  resolvedDistances: number[][];

  // The sequence of characters input so far.
  inputSequence: string[] = [];
  matchSequence: string[] = [];

  constructor();
  constructor(other: BaselineIterativeDamerauLevenshteinCalculation);
  constructor(other?: BaselineIterativeDamerauLevenshteinCalculation) {
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
    return this.resolvedDistances[i+2][j+2];
  }

  // Inputs add an extra row / first index entry.
  addInputChar(char: string): BaselineIterativeDamerauLevenshteinCalculation {
    let returnBuffer = new BaselineIterativeDamerauLevenshteinCalculation(this);
    // True index within the buffer
    let r = returnBuffer.inputSequence.length;
    let rowIndex = r + 2;

    // The first input char == row index 2, and the second column should be assigned a 1 - deletion of that single char to match an empty string.
    returnBuffer.resolvedDistances[this.resolvedDistances.length] = [Number.MAX_VALUE, rowIndex - 1];
    
    returnBuffer.inputSequence.push(char);

    for(let c = 0; c < this.matchSequence.length; c++) {
      let colIndex = c + 2;
      returnBuffer.resolvedDistances[rowIndex][colIndex] = returnBuffer.computeValue(r, c);
    }

    return returnBuffer;
  }

  addMatchChar(char: string): BaselineIterativeDamerauLevenshteinCalculation {
    let returnBuffer = new BaselineIterativeDamerauLevenshteinCalculation(this);
    // True index within the buffer
    let c = this.matchSequence.length
    let colIndex = c + 2;

    // The first match char == col index 2.
    returnBuffer.resolvedDistances[0][colIndex] = Number.MAX_VALUE;
    returnBuffer.resolvedDistances[1][colIndex] = colIndex - 1;

    returnBuffer.matchSequence.push(char);

    for(let r = 0; r < this.inputSequence.length; r++) {
      let rowIndex = r + 2;
      returnBuffer.resolvedDistances[rowIndex][colIndex] = returnBuffer.computeValue(r, c);
    }

    return returnBuffer;
  }

  // Used by addInputChar and addMatchChar.
  private computeValue(r: number, c: number) {
    let inputChar = this.inputSequence[r];
    let matchChar = this.matchSequence[c];

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
}
var assert = require('chai').assert;
var DiagonalizedIterativeDamerauLevenshteinCalculation = require('../../dist').secondIterativeImplementation;

function prettyPrintMatrix(matrix) {
  for(let r = 0; r < matrix.length; r++) {
    console.log(JSON.stringify(matrix[r], function(key, value) {
      if(value == Number.MAX_VALUE) {
        return "MAX";
      } else if(value === undefined) {
        return -1;
      } else {
        return value;
      }
    }));
  }
}

function compute(input, match, mode, bandSize) {
  let buffer = new DiagonalizedIterativeDamerauLevenshteinCalculation();

  /* SUPPORTED MODES:
   * "InputThenMatch"  // adds all input chars, then all match chars.
   * "MatchThenInput"  // adds all match chars, then all input chars.
   */

  // TEMP:  once diagonal expansion is implemented, do this LATER, AFTER adding the chars.
  bandSize = bandSize || 1;
  buffer.diagonalWidth = bandSize;

  switch(mode || "InputThenMatch") {
    case "InputThenMatch":
      for(let i = 0; i < input.length; i++) {
        buffer = buffer.addInputChar(input.charAt(i));
      }
    
      for(let j = 0; j < match.length; j++) {
        buffer = buffer.addMatchChar(match.charAt(j));
      }
      break;
    case "MatchThenInput":    
      for(let j = 0; j < match.length; j++) {
        buffer = buffer.addMatchChar(match.charAt(j));
      }

      for(let i = 0; i < input.length; i++) {
        buffer = buffer.addInputChar(input.charAt(i));
      }
      break;
    default:
      throw "Invalid test mode specified!"
  }

  return buffer;
}

describe('Diagonalized Damerau-Levenshtein implementation checks', function() {
  it("'abc' -> 'abc' = 0", function() {
    assert.equal(compute("abc", "abc", "InputThenMatch").getFinalCost(), 0);
    assert.equal(compute("abc", "abc", "MatchThenInput").getFinalCost(), 0);
  });

  it("'abc' -> 'cab' = 2", function() {
    assert.equal(compute("abc", "cab", "InputThenMatch").getFinalCost(), 2);
    assert.equal(compute("abc", "cab", "MatchThenInput").getFinalCost(), 2);
  });

  it("'abc' -> 'cdb' = 3", function() {
    assert.equal(compute("abc", "cdb", "InputThenMatch").getFinalCost(), 3);
    assert.equal(compute("abc", "cdb", "MatchThenInput").getFinalCost(), 3);
  });

  it("'cab' -> 'bac' = 2", function() {
    assert.equal(compute("cab", "bac", "InputThenMatch").getFinalCost(), 2);
    assert.equal(compute("cab", "bac", "MatchThenInput").getFinalCost(), 2);
  });

  it("'cab' -> 'bdc' = 2", function() {
    assert.equal(compute("cab", "bdc", "InputThenMatch").getFinalCost(), 3);
    assert.equal(compute("cab", "bdc", "MatchThenInput").getFinalCost(), 3);
  });

  it("'access' -> 'assess' = 2", function() {
    assert.equal(compute("access", "assess", "InputThenMatch").getFinalCost(), 2);
    assert.equal(compute("access", "assess", "MatchThenInput").getFinalCost(), 2);
  })

  it("'foo' -> 'foo' = 0", function() {
    assert.equal(compute("foo", "foo", "InputThenMatch").getFinalCost(), 0);
    assert.equal(compute("foo", "foo", "MatchThenInput").getFinalCost(), 0);
  })

  it("'help' -> 'yelp' = 1", function() {
    assert.equal(compute("help", "yelp", "InputThenMatch").getFinalCost(), 1);
    assert.equal(compute("help", "yelp", "MatchThenInput").getFinalCost(), 1);
  })

  it("'teh' -> 'the' = 1", function() {
    assert.equal(compute("teh", "the", "InputThenMatch").getFinalCost(), 1);
    assert.equal(compute("teh", "the", "MatchThenInput").getFinalCost(), 1);
  });

  // 'aa' considered to be inserted within the transposition.
  it("'teaah' -> 'the' = 3", function() {
    assert.equal(compute("teaah", "the", "InputThenMatch").getFinalCost(), 3);  // Note:  requires diagonal of width 2, not 1.
    assert.equal(compute("teaah", "the", "MatchThenInput").getFinalCost(), 3);
  });

  // d & b transposed, then 'c' inserted.
  it("'adb' -> 'abcd' = 2", function() {
    assert.equal(compute("adb", "abcd", "InputThenMatch").getFinalCost(), 2);
    assert.equal(compute("adb", "abcd", "MatchThenInput").getFinalCost(), 2);
  });

  it("'the' -> '' = 3", function() {
    assert.equal(compute("the", "", "InputThenMatch").getFinalCost(), 3);
    assert.equal(compute("the", "", "MatchThenInput").getFinalCost(), 3);
  });
  
  it("'' -> 'the' = 3", function() {
    // Oh yeah, gotta do the null-string match case.
    assert.equal(compute("", "the", "InputThenMatch").getFinalCost(), 3);
    assert.equal(compute("", "the", "MatchThenInput").getFinalCost(), 3);
  });

  it("'accomodate' -> 'accommodate' = 1", function() {
    assert.equal(compute("accomodate", "accommodate", "InputThenMatch").getFinalCost(), 1);
    assert.equal(compute("accomodate", "accommodate", "MatchThenInput").getFinalCost(), 1);
  });

  it("'belitttle' -> 'belittle' = 1", function() {
    assert.equal(compute("belitttle", "belittle", "InputThenMatch").getFinalCost(), 1);
    assert.equal(compute("belitttle", "belittle", "MatchThenInput").getFinalCost(), 1);
  });

  it("'harras' -> 'harass' = 2", function() {
    assert.equal(compute("harras", "harass", "InputThenMatch").getFinalCost(), 2);
    assert.equal(compute("harras", "harass", "MatchThenInput").getFinalCost(), 2);
  });

  it("'hiegth' -> 'height' = 2", function() {
    assert.equal(compute("hiegth", "height", "InputThenMatch").getFinalCost(), 2);
    assert.equal(compute("hiegth", "height", "MatchThenInput").getFinalCost(), 2);
  });

  it("'jellyifhs' -> 'jellyfish' = 2", function() {
    assert.equal(compute("jellyifhs", "jellyfish", "InputThenMatch").getFinalCost(), 2);
    assert.equal(compute("jellyifhs", "jellyfish", "MatchThenInput").getFinalCost(), 2);
  });

  it("'aadddres' -> 'address' = 3", function() {
    // If diagonal set to '1', cost is reported as 4.
    assert.equal(compute("aadddres", "address", "InputThenMatch").getFinalCost(), 3);
    assert.equal(compute("aadddres", "address", "MatchThenInput").getFinalCost(), 3);
  });

  describe("Intermediate cost tests", function() {
    it("'abc' -> 'cab' (width 1) = 2", function() {
      // Technically a heuristic here, but it gets the right value b/c all changes are on the diagonal.
      assert.equal(compute("abc", "cab", "InputThenMatch").getHeuristicFinalCost(), 2);
      assert.equal(compute("abc", "cab", "MatchThenInput").getHeuristicFinalCost(), 2);
    });

    it("'aadddres' -> 'address' (width 1) = 4", function() {
      // If diagonal set to '1', cost is reported as 4.
      assert.equal(compute("aadddres", "address", "InputThenMatch").getHeuristicFinalCost(), 4);
      assert.equal(compute("aadddres", "address", "MatchThenInput").getHeuristicFinalCost(), 4);
    });
  
    it("'aadddres' -> 'address' (width 2) = 3", function() {
      // If diagonal set to '1', cost is reported as 4.
      assert.equal(compute("aadddres", "address", "InputThenMatch", 2).getHeuristicFinalCost(), 3);
      assert.equal(compute("aadddres", "address", "MatchThenInput", 2).getHeuristicFinalCost(), 3);
    });

    it("'jellyifhs' -> 'jellyfish' (width 1) = 2", function() {
      // Technically a heuristic here, but it gets the right value b/c all changes are on the diagonal.
      assert.equal(compute("jellyifhs", "jellyfish", "InputThenMatch").getHeuristicFinalCost(), 2);
      assert.equal(compute("jellyifhs", "jellyfish", "MatchThenInput").getHeuristicFinalCost(), 2);
    });

    // Two transpositions:  abc -> ca, ig <- ghi.  Also, one deletion:  'd'.
    it("'abcdefig' -> 'caefghi' (width 1) = 7", function() {
      let buffer = compute("abcdefig", "caefghi", "InputThenMatch");
      // This test case was constructed with the tranposition parts outside of the center diagonal.  
      assert.equal(buffer.getHeuristicFinalCost(), 7);
    });

    // Two transpositions:  abc -> ca, ig <- ghi.  Also, one deletion:  'd'.
    it("'abcdefig' -> 'caefghi' (width 2) = 5", function() {
      let buffer = compute("abcdefig", "caefghi", "InputThenMatch", 2);
      assert.equal(buffer.getHeuristicFinalCost(), 5);
    });

    // Two transpositions:  abc -> ca, ig <- ghi.  Also, one deletion:  'd'.
    it("'abcdefigj' -> 'caefghij' (width 1) = 7", function() {
      let buffer = compute("abcdefigj", "caefghij", "InputThenMatch", 1);
      assert.equal(buffer.getHeuristicFinalCost(), 7);
    });

    // Two transpositions:  abc -> ca, ig <- ghi.  Also, one deletion:  'd'.
    it("'abcdefigj' -> 'caefghij' (width 2) = 5", function() {
      let buffer = compute("abcdefigj", "caefghij", "InputThenMatch", 2);
      assert.equal(buffer.getHeuristicFinalCost(), 5);
    });
    
    // A single transposition, early in the string:  abc -> ca.  Also, one deletion:  'd'.
    // Width 1 check returns Number.MAX_VALUE due to length differences.
    it("'abcdef' -> 'caef' (width 2) = 3", function() {
      let buffer = compute("abcdef", "caef", "InputThenMatch", 2);
      assert.equal(buffer.getHeuristicFinalCost(), 3);
    });
  });

  describe("Diagonal extension tests", function() {
    it("'aadddres' -> 'address' (width 1->2) = 3", function() {
      // If diagonal set to '1', cost is reported as 4.
      let buffer = compute("aadddres", "address", "InputThenMatch", 1);
      assert.equal(buffer.getHeuristicFinalCost(), 4);

      // 1 -> 2
      buffer = buffer.increaseMaxDistance();
      assert.equal(buffer.getHeuristicFinalCost(), 3);
    });

    // Two transpositions:  abc -> ca, ig <- ghi.  Also, one deletion:  'd'.
    it("'abcdefig' -> 'caefghi' (width 1->2) = 5", function() {
      let buffer = compute("abcdefig", "caefghi", "InputThenMatch", 1);
      // This test case was constructed with the tranposition parts outside of the center diagonal.  
      assert.equal(buffer.getHeuristicFinalCost(), 7);

      // 1 -> 2
      buffer = buffer.increaseMaxDistance();
      assert.equal(buffer.getHeuristicFinalCost(), 5);
    });

    // Two transpositions:  abc -> ca, ig <- ghi.  Also, one deletion:  'd'.
    it("'abcdefigj' -> 'caefghij' (width 1->2) = 5", function() {
      let buffer = compute("abcdefigj", "caefghij", "InputThenMatch", 1);
      // This test case was constructed with the tranposition parts outside of the center diagonal.  
      assert.equal(buffer.getHeuristicFinalCost(), 7);

      // 1 -> 2
      buffer = buffer.increaseMaxDistance();
      assert.equal(buffer.getHeuristicFinalCost(), 5);
    });
    
    // A single transposition, early in the string:  abc -> ca.  Also, one deletion:  'd'.
    it("'abcdef' -> 'caef' (width 1->2) = 5", function() {
      let buffer = compute("abcdef", "caef", "InputThenMatch", 1);
      // This test case was constructed with the tranposition parts outside of the center diagonal.  
      assert.equal(buffer.getHeuristicFinalCost(), 5);

      // 1 -> 2
      buffer = buffer.increaseMaxDistance();
      assert.equal(buffer.getHeuristicFinalCost(), 3);
    }); 
  });

  
  describe("Bounded final cost tests", function() {
    it("'adddress' -> 'address' has final cost within 4", function() {
      let buffer = compute("aadddres", "address", "InputThenMatch");
      assert.isTrue(buffer.hasFinalCostWithin(4));
    })

    it("'adddress' -> 'address' has final cost within 3", function() {
      let buffer = compute("aadddres", "address", "InputThenMatch");
      assert.isTrue(buffer.hasFinalCostWithin(3));
    })

    
    it("'adddress' -> 'address' does not have final cost within 2", function() {
      let buffer = compute("aadddres", "address", "InputThenMatch");
      assert.isFalse(buffer.hasFinalCostWithin(2));
    })
  });
});
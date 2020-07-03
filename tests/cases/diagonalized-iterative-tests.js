var assert = require('chai').assert;
var DiagonalizedIterativeDamerauLevenshteinCalculation = require('../../dist').secondIterativeImplementation;

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

  // Pretty-printing for the buffer:
  // for(let r = 0; r < buffer.resolvedDistances.length; r++) {
  //   console.log(JSON.stringify(buffer.resolvedDistances[r], function(key, value) {
  //     if(value == Number.MAX_VALUE) {
  //       return "MAX";
  //     } else if(value === undefined) {
  //       return -1;
  //     } else {
  //       return value;
  //     }
  //   }));
  //}

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
    assert.equal(compute("teaah", "the", "InputThenMatch", 2).getFinalCost(), 3);
    assert.equal(compute("teaah", "the", "MatchThenInput", 2).getFinalCost(), 3);
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

  it("'aadddres' -> 'address' (width 1) = 4", function() {
    // If diagonal set to '1', cost is reported as 4.
    assert.equal(compute("aadddres", "address", "InputThenMatch").getFinalCost(), 4);
    assert.equal(compute("aadddres", "address", "MatchThenInput").getFinalCost(), 4);
  });

  it("'aadddres' -> 'address' (width 2) = 3", function() {
    // If diagonal set to '1', cost is reported as 4.
    assert.equal(compute("aadddres", "address", "InputThenMatch", 2).getFinalCost(), 3);
    assert.equal(compute("aadddres", "address", "MatchThenInput", 2).getFinalCost(), 3);
  });

  describe("Diagonal extension tests", function() {
    it("'aadddres' -> 'address' (width 1->2) = 3", function() {
      // If diagonal set to '1', cost is reported as 4.
      let buffer = compute("aadddres", "address", "InputThenMatch", 1);
      assert.equal(buffer.getFinalCost(), 4);

      // 1 -> 2
      buffer = buffer.increaseMaxDistance();
      assert.equal(buffer.getFinalCost(), 3);
    });
  });
});
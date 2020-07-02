var assert = require('chai').assert;
var DiagonalizedIterativeDamerauLevenshteinCalculation = require('../../dist').secondIterativeImplementation;

function runTest(input, match, mode, bandSize) {
  let buffer = new DiagonalizedIterativeDamerauLevenshteinCalculation();

  /* SUPPORTED MODES:
   * "InputThenMatch"  // adds all input chars, then all match chars.
   * "MatchThenInput"  // adds all match chars, then all input chars.
   */

  // TEMP:  once diagonal expansion is implemented, do this LATER, AFTER adding the chars.
  bandSize = bandSize || 1;
  buffer.maxEditDistance = bandSize;

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

  return buffer.getCostAt(input.length-1, match.length-1);
}

describe('Diagonalized Damerau-Levenshtein implementation checks', function() {
  it("'abc' -> 'abc' = 0", function() {
    assert.equal(runTest("abc", "abc", "InputThenMatch"), 0);
    assert.equal(runTest("abc", "abc", "MatchThenInput"), 0);
  });

  it("'abc' -> 'cab' = 2", function() {
    assert.equal(runTest("abc", "cab", "InputThenMatch"), 2);
    assert.equal(runTest("abc", "cab", "MatchThenInput"), 2);
  });

  it("'abc' -> 'cdb' = 3", function() {
    assert.equal(runTest("abc", "cdb", "InputThenMatch"), 3);
    assert.equal(runTest("abc", "cdb", "MatchThenInput"), 3);
  });

  it("'cab' -> 'bac' = 2", function() {
    assert.equal(runTest("cab", "bac", "InputThenMatch"), 2);
    assert.equal(runTest("cab", "bac", "MatchThenInput"), 2);
  });

  it("'cab' -> 'bdc' = 2", function() {
    assert.equal(runTest("cab", "bdc", "InputThenMatch"), 3);
    assert.equal(runTest("cab", "bdc", "MatchThenInput"), 3);
  });

  it("'access' -> 'assess' = 2", function() {
    assert.equal(runTest("access", "assess", "InputThenMatch"), 2);
    assert.equal(runTest("access", "assess", "MatchThenInput"), 2);
  })

  it("'foo' -> 'foo' = 0", function() {
    assert.equal(runTest("foo", "foo", "InputThenMatch"), 0);
    assert.equal(runTest("foo", "foo", "MatchThenInput"), 0);
  })

  it("'help' -> 'yelp' = 1", function() {
    assert.equal(runTest("help", "yelp", "InputThenMatch"), 1);
    assert.equal(runTest("help", "yelp", "MatchThenInput"), 1);
  })

  it("'teh' -> 'the' = 1", function() {
    assert.equal(runTest("teh", "the", "InputThenMatch"), 1);
    assert.equal(runTest("teh", "the", "MatchThenInput"), 1);
  });

  // 'aa' considered to be inserted within the transposition.
  it("'teaah' -> 'the' = 3", function() {
    assert.equal(runTest("teaah", "the", "InputThenMatch", 2), 3);
    assert.equal(runTest("teaah", "the", "MatchThenInput", 2), 3);
  });

  // d & b transposed, then 'c' inserted.
  it("'adb' -> 'abcd' = 2", function() {
    assert.equal(runTest("adb", "abcd", "InputThenMatch"), 2);
    assert.equal(runTest("adb", "abcd", "MatchThenInput"), 2);
  });

  it("'the' -> '' = 3", function() {
    assert.equal(runTest("the", "", "InputThenMatch"), 3);
    assert.equal(runTest("the", "", "MatchThenInput"), 3);
  });

  it("'accomodate' -> 'accommodate' = 1", function() {
    assert.equal(runTest("accomodate", "accommodate", "InputThenMatch"), 1);
    assert.equal(runTest("accomodate", "accommodate", "MatchThenInput"), 1);
  });

  it("'belitttle' -> 'belittle' = 1", function() {
    assert.equal(runTest("belitttle", "belittle", "InputThenMatch"), 1);
    assert.equal(runTest("belitttle", "belittle", "MatchThenInput"), 1);
  });

  it("'harras' -> 'harass' = 2", function() {
    assert.equal(runTest("harras", "harass", "InputThenMatch"), 2);
    assert.equal(runTest("harras", "harass", "MatchThenInput"), 2);
  });

  it("'hiegth' -> 'height' = 2", function() {
    assert.equal(runTest("hiegth", "height", "InputThenMatch"), 2);
    assert.equal(runTest("hiegth", "height", "MatchThenInput"), 2);
  });

  it("'jellyifhs' -> 'jellyfish' = 2", function() {
    assert.equal(runTest("jellyifhs", "jellyfish", "InputThenMatch"), 2);
    assert.equal(runTest("jellyifhs", "jellyfish", "MatchThenInput"), 2);
  });
});
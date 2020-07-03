var assert = require('chai').assert;
var BaselineIterativeDamerauLevenshteinCalculation = require('../../dist').firstIterativeImplementation;

function compute(input, match) {
  let buffer = new BaselineIterativeDamerauLevenshteinCalculation();
  
  for(let i = 0; i < input.length; i++) {
    buffer = buffer.addInputChar(input.charAt(i));
  }

  for(let j = 0; j < match.length; j++) {
    buffer = buffer.addMatchChar(match.charAt(j));
  }

  return buffer;
}

describe('Initial iterative Damerau-Levenshtein implementation checks', function() {
  it("'abc' -> 'abc' = 0", function() {
    assert.equal(compute("abc", "abc").getFinalCost(), 0);
  });

  it("'abc' -> 'cab' = 2", function() {
    assert.equal(compute("abc", "cab").getFinalCost(), 2);
  });

  it("'abc' -> 'cdb' = 3", function() {
    assert.equal(compute("abc", "cdb").getFinalCost(), 3);
  });

  it("'cab' -> 'bac' = 2", function() {
    assert.equal(compute("cab", "bac").getFinalCost(), 2);
  });

  it("'cab' -> 'bdc' = 2", function() {
    assert.equal(compute("cab", "bdc").getFinalCost(), 3);
  });

  it("'access' -> 'assess' = 2", function() {
    assert.equal(compute("access", "assess").getFinalCost(), 2);
  })

  it("'foo' -> 'foo' = 0", function() {
    assert.equal(compute("foo", "foo").getFinalCost(), 0);
  })

  it("'help' -> 'yelp' = 1", function() {
    assert.equal(compute("help", "yelp").getFinalCost(), 1);
  })

  it("'teh' -> 'the' = 1", function() {
    assert.equal(compute("teh", "the").getFinalCost(), 1);
  });

  // 'aa' considered to be inserted within the transposition.
  it("'teaah' -> 'the' = 3", function() {
    assert.equal(compute("teaah", "the").getFinalCost(), 3);
  });

  // d & b transposed, then 'c' inserted.
  it("'adb' -> 'abcd' = 2", function() {
    assert.equal(compute("adb", "abcd").getFinalCost(), 2);
  });

  it("'the' -> '' = 3", function() {
    assert.equal(compute("the", "").getFinalCost(), 3);
  });

  it("'accomodate' -> 'accommodate' = 1", function() {
    assert.equal(compute("accomodate", "accommodate").getFinalCost(), 1);
  });

  it("'belitttle' -> 'belittle' = 1", function() {
    assert.equal(compute("belitttle", "belittle").getFinalCost(), 1);
  });

  it("'harras' -> 'harass' = 2", function() {
    assert.equal(compute("harras", "harass").getFinalCost(), 2);
  });

  it("'hiegth' -> 'height' = 2", function() {
    assert.equal(compute("hiegth", "height").getFinalCost(), 2);
  });

  it("'jellyifhs' -> 'jellyfish' = 2", function() {
    assert.equal(compute("jellyifhs", "jellyfish").getFinalCost(), 2);
  });
  
  it("'aadddres' -> 'address' = 3", function() {
    assert.equal(compute("aadddres", "address").getFinalCost(), 3);
  });

  // Two transpositions:  abc -> ca, ig <- ghi.  Each is cost 2 because of the intermediate char in each. 
  // Also, one deletion:  'd'.
  it("'abcdefig' -> 'caefghi'", function() {
    assert.equal(compute("abcdefig", "caefghi").getFinalCost(), 5);
  });
});
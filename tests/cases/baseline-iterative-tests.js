var assert = require('chai').assert;
var BaselineIterativeDamerauLevenshteinCalculation = require('../../dist').firstIterativeImplementation;

function runTestNaively(input, match) {
  let buffer = new BaselineIterativeDamerauLevenshteinCalculation();
  
  for(let i = 0; i < input.length; i++) {
    buffer = buffer.addInputChar(input.charAt(i));
  }

  for(let j = 0; j < match.length; j++) {
    buffer = buffer.addMatchChar(match.charAt(j));
  }

  return buffer.getCostAt(input.length-1, match.length-1);
}

describe('Baseline Damerau-Levenshtein implementation checks', function() {
  it("'abc' -> 'abc' = 0", function() {
    assert.equal(runTestNaively("abc", "abc"), 0);
  });

  it("'abc' -> 'cab' = 2", function() {
    assert.equal(runTestNaively("abc", "cab"), 2);
  });

  it("'abc' -> 'cdb' = 3", function() {
    assert.equal(runTestNaively("abc", "cdb"), 3);
  });

  it("'cab' -> 'bac' = 2", function() {
    assert.equal(runTestNaively("cab", "bac"), 2);
  });

  it("'cab' -> 'bdc' = 2", function() {
    assert.equal(runTestNaively("cab", "bdc"), 3);
  });

  it("'access' -> 'assess' = 2", function() {
    assert.equal(runTestNaively("access", "assess"), 2);
  })

  it("'foo' -> 'foo' = 0", function() {
    assert.equal(runTestNaively("foo", "foo"), 0);
  })

  it("'help' -> 'yelp' = 1", function() {
    assert.equal(runTestNaively("help", "yelp"), 1);
  })

  it("'teh' -> 'the' = 1", function() {
    assert.equal(runTestNaively("teh", "the"), 1);
  });

  // 'aa' considered to be inserted within the transposition.
  it("'teaah' -> 'the' = 3", function() {
    assert.equal(runTestNaively("teaah", "the"), 3);
  });

  // d & b transposed, then 'c' inserted.
  it("'adb' -> 'abcd' = 2", function() {
    assert.equal(runTestNaively("adb", "abcd"), 2);
  });

  it("'the' -> '' = 3", function() {
    assert.equal(runTestNaively("the", ""), 3);
  });

  it("'accomodate' -> 'accommodate' = 1", function() {
    assert.equal(runTestNaively("accomodate", "accommodate"), 1);
  });

  it("'belitttle' -> 'belittle' = 1", function() {
    assert.equal(runTestNaively("belitttle", "belittle"), 1);
  });

  it("'harras' -> 'harass' = 2", function() {
    assert.equal(runTestNaively("harras", "harass"), 2);
  });

  it("'hiegth' -> 'height' = 2", function() {
    assert.equal(runTestNaively("hiegth", "height"), 2);
  });

  it("'jellyifhs' -> 'jellyfish' = 2", function() {
    assert.equal(runTestNaively("jellyifhs", "jellyfish"), 2);
  });
});
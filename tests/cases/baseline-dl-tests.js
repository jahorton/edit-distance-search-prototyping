var assert = require('chai').assert;

var baselineDistance = require('../../dist').baselineImplementation;
describe('Baseline Damerau-Levenshtein implementation checks', function() {
  it("'abc' -> 'abc' = 0", function() {
    assert.equal(baselineDistance("abc", "abc"), 0);
  });

  it("'abc' -> 'cab' = 2", function() {
    assert.equal(baselineDistance("abc", "cab"), 2);
  });

  it("'abc' -> 'cdb' = 3", function() {
    assert.equal(baselineDistance("abc", "cdb"), 3);
  });

  it("'cab' -> 'bac' = 2", function() {
    assert.equal(baselineDistance("cab", "bac"), 2);
  });

  it("'cab' -> 'bdc' = 2", function() {
    assert.equal(baselineDistance("cab", "bdc"), 3);
  });

  it("'access' -> 'assess' = 2", function() {
    assert.equal(baselineDistance("access", "assess"), 2);
  })

  it("'foo' -> 'foo' = 0", function() {
    assert.equal(baselineDistance("foo", "foo"), 0);
  })

  it("'help' -> 'yelp' = 1", function() {
    assert.equal(baselineDistance("help", "yelp"), 1);
  })

  it("'teh' -> 'the' = 1", function() {
    assert.equal(baselineDistance("teh", "the"), 1);
  });

  // 'aa' considered to be inserted within the transposition.
  it("'teaah' -> 'the' = 3", function() {
    assert.equal(baselineDistance("teaah", "the"), 3);
  });

  // d & b transposed, then 'c' inserted.
  it("'adb' -> 'abcd' = 2", function() {
    assert.equal(baselineDistance("adb", "abcd"), 2);
  });

  it("'the' -> '' = 3", function() {
    assert.equal(baselineDistance("the", ""), 3);
  });

  it("'accomodate' -> 'accommodate' = 1", function() {
    assert.equal(baselineDistance("accomodate", "accommodate"), 1);
  });

  it("'belitttle' -> 'belittle' = 1", function() {
    assert.equal(baselineDistance("belitttle", "belittle"), 1);
  });

  it("'harras' -> 'harass' = 2", function() {
    assert.equal(baselineDistance("harras", "harass"), 2);
  });

  it("'hiegth' -> 'height' = 2", function() {
    assert.equal(baselineDistance("hiegth", "height"), 2);
  });

  it("'jellyifhs' -> 'jellyfish' = 2", function() {
    assert.equal(baselineDistance("jellyifhs", "jellyfish"), 2);
  });
});
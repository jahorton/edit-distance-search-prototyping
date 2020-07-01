var assert = require('chai').assert;

var baselineDistance = require('../../dist');
describe('Baseline Damerau-Levenshtein implementation checks', function() {
  it("'abc' -> 'cab' = 2", function() {
    assert.equal(baselineDistance("abc", "cab"), 2);
  });

  it("'cab' -> 'bac' = 2", function() {
    assert.equal(baselineDistance("cab", "bac"), 2);
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
});
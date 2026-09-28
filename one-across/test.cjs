const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');

const script = readFileSync(__dirname + '/app.js', 'utf8');
const crossword = script.slice(script.indexOf('const words ='), script.indexOf('function showGrid'));
const {words, crossings} = vm.runInNewContext(crossword + ';({words,crossings})');
for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
  const word = words[letter];
  assert.ok(word && word.length <= 5 && [1, 2].includes(word.indexOf(letter)), `bad crossing for ${letter}`);
  for (let n = 3; n <= 12; n++) {
    const crosses = crossings(letter.repeat(n));
    assert.equal(crosses.length, 2);
    assert.ok(crosses[0].p >= 0 && crosses[1].p < n && crosses[0].p < crosses[1].p);
    assert.equal(crosses[0].l, letter);
    assert.equal(crosses[1].l, letter);
  }
}
console.log('One Across crossing check passed');

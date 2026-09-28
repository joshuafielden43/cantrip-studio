const $ = id => document.getElementById(id);
window.addEventListener('hashchange', () => location.reload());
const makeForm = $('create-form'), solveForm = $('solve-form');
const words = {A:'GLASS',B:'RUBY',C:'ECHO',D:'IDEA',E:'PEAR',F:'AFTER',G:'SUGAR',H:'CHAIR',I:'RIVER',J:'AJAR',K:'SKY',L:'GLASS',M:'AMBER',N:'SNAKE',O:'STONE',P:'APPLE',Q:'AQUA',R:'TREE',S:'ASH',T:'STAR',U:'RUBY',V:'AVOID',W:'AWE',X:'AXE',Y:'LYRIC',Z:'AZURE'};
function crossings(answer) {
  const n = answer.length;
  return [{p:Math.floor((n-1)/4),l:answer[Math.floor((n-1)/4)]}, {p:Math.ceil((n-1)*3/4),l:answer[Math.ceil((n-1)*3/4)]}];
}
function showGrid(n, letters = '', crosses = []) {
  const grid = $('grid'), cells = new Map();
  grid.style.setProperty('--n', n); grid.style.aspectRatio = `${n} / 6`;
  for (let x=0; x<n; x++) cells.set(`${x},2`, {x,y:2,letter:letters[x] || crosses.find(c => c.p === x)?.l || '',number:x===0?'1':''});
  crosses.forEach((cross, i) => {
    const word = words[cross.l], start = 2-word.indexOf(cross.l);
    for (let j=0; j<word.length; j++) {
      const y=start+j, key=`${cross.p},${y}`;
      if (y!==2) cells.set(key,{x:cross.p,y,letter:word[j],number:j===0?String(i+2):''});
    }
  });
  grid.replaceChildren(...[...cells.values()].map(({x,y,letter,number}) => {
    const cell=document.createElement('span'); cell.className='cell';
    if (y===2 && crosses.some(c => c.p===x)) cell.classList.add('cross');
    if (!cells.has(`${x+1},${y}`)) cell.classList.add('right');
    if (!cells.has(`${x},${y+1}`)) cell.classList.add('bottom');
    cell.style.gridColumn=x+1; cell.style.gridRow=y+1; cell.textContent=letter;
    if (number) cell.dataset.number=number;
    return cell;
  }));
}
function status(id, message, ok = false) {
  const el = $(id); el.textContent = message; el.classList.toggle('ok', ok);
}
async function hash(text) {
  const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(data), b => b.toString(16).padStart(2, '0')).join('');
}
function error(message) {
  $('bad-message').textContent = message;
  $('bad-link').classList.remove('hidden'); makeForm.classList.add('hidden'); solveForm.classList.add('hidden');
  $('paper-title').textContent = 'This link needs a fresh start.'; $('clue-display').textContent = 'The puzzle link is incomplete or damaged.'; $('grid').replaceChildren();
}
if (!globalThis.crypto?.subtle) {
  error('This puzzle needs a secure browser connection (HTTPS or localhost). Open it there to make or solve a puzzle.');
} else if (location.hash) {
  try {
    const fields = new URLSearchParams(location.hash.slice(1));
    const v = fields.get('v'), clue = fields.get('c'), n = Number(fields.get('n')), digest = fields.get('h'), crossText = fields.get('x') || '';
    const crosses = crossText.split('.').map(item => ({p:Number(item.slice(0,-1)),l:item.slice(-1)}));
    if (fields.size !== 5 || v !== '1' || !clue || clue.trim() !== clue || clue.length > 200 || !Number.isInteger(n) || n < 3 || n > 12 || !/^[a-f0-9]{64}$/.test(digest || '') || !/^(0|[1-9][0-9]?)[A-Z]\.(0|[1-9][0-9]?)[A-Z]$/.test(crossText) || crosses[0].p!==Math.floor((n-1)/4) || crosses[1].p!==Math.ceil((n-1)*3/4) || crosses.some(c => !words[c.l])) throw new Error('invalid');
    makeForm.classList.add('hidden'); solveForm.classList.remove('hidden');
    $('paper-kicker').textContent = 'One across'; $('paper-title').textContent = `${n} letters.`;
    $('paper-lede').textContent = 'A word someone wanted you to find.'; $('clue-display').textContent = clue; $('guess').maxLength = n; showGrid(n,'',crosses);
    solveForm.addEventListener('submit', async event => {
      event.preventDefault(); const guess = $('guess').value.trim().toUpperCase();
      if (!/^[A-Z]+$/.test(guess) || guess.length !== n) { status('solve-status', `Enter exactly ${n} letters (A–Z).`); return; }
      if (await hash(guess) === digest) { showGrid(n,guess,crosses); $('grid').classList.add('celebrate'); status('solve-status', `Yes. ${guess} is the word.`, true); $('guess').disabled = true; solveForm.querySelector('button').disabled = true; }
      else status('solve-status', 'Not yet. Try another word.');
    });
  } catch { error('That puzzle link is incomplete or damaged. Ask the sender for a fresh link, or make a new puzzle.'); }
} else {
  showGrid(7,'',[{p:1,l:'U'},{p:5,l:'A'}]);
  makeForm.addEventListener('submit', async event => {
    event.preventDefault(); status('create-status', ''); $('created').classList.add('hidden');
    const answer = $('answer').value.trim().toUpperCase(), clue = $('clue').value.trim();
    if (!/^[A-Z]{3,12}$/.test(answer)) { status('create-status', 'Use 3–12 letters (A–Z) for the word.'); $('answer').focus(); return; }
    if (!clue || clue.length > 200) { status('create-status', 'Write a clue of 1–200 characters.'); $('clue').focus(); return; }
    const crosses = crossings(answer);
    const fields = new URLSearchParams({v:'1', c:clue, n:String(answer.length), h:await hash(answer), x:crosses.map(c=>`${c.p}${c.l}`).join('.')});
    const link = new URL(location.href); link.hash = fields.toString();
    $('share-link').value = link.href; $('preview').href = link.href;
    $('answer').value = ''; showGrid(answer.length,'',crosses); $('clue-display').textContent = clue;
    $('created').classList.remove('hidden'); status('create-status', 'Link ready. Your word has been cleared from this page.', true);
  });
  $('copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('share-link').value); status('copy-status', 'Copied.', true); }
    catch { $('share-link').focus(); $('share-link').select(); status('copy-status', 'Copy the selected link manually.'); }
  });
}

// node --test plugins/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { measure, minutesFor } from './remark-reading-time.mjs';

const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ');
const minutes = (md) => minutesFor(measure(fromMarkdown(md)));

test('prose only: 200 words per minute, rounded up', () => {
  assert.equal(minutes(words(200)), 1);
  assert.equal(minutes(words(201)), 2);
  assert.equal(minutes(words(1000)), 5);
});

test('code in a fenced block counts as words', () => {
  const md = `${words(190)}\n\n\`\`\`js\n${words(20)}\n\`\`\`\n`;
  assert.deepEqual(measure(fromMarkdown(md)), { words: 210, figures: 0 });
  assert.equal(minutes(md), 2);
});

test('figures add 10 seconds each, markup is not counted as words', () => {
  const figure = '<figure class="d2-diagram" aria-label="a diagram of many words here">\n<img src="/x.svg" alt="" />\n</figure>';
  const md = `${words(180)}\n\n${figure}\n\n![alt text](/y.png)\n`;
  // 180 words = 54 s, two figures = 20 s: 74 s → 2 minutes. Alt text is
  // covered by the figure's time, not counted as words.
  assert.deepEqual(measure(fromMarkdown(md)), { words: 180, figures: 2 });
  assert.equal(minutes(md), 2);
});

test('words in separate blocks are not glued together', () => {
  assert.equal(measure(fromMarkdown('one two\n\n# three\n\n- four\n- five')).words, 5);
});

test('a lone <img> in HTML counts once', () => {
  assert.equal(measure(fromMarkdown('<img src="/a.png" alt="" />')).figures, 1);
});

test('an empty body is 1 minute', () => {
  assert.equal(minutes(''), 1);
});

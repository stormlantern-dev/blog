// Reading time per post, at build time (PRD 0057, R1).
//
// Prose and code count as words at 200 words per minute; every figure (a
// Markdown image, or an inline HTML <figure>/<img>, which is how the D2
// diagrams are embedded) adds 10 seconds. The result is whole minutes, at
// least 1, and lands in the post's frontmatter as `minutesRead`, so the post
// page and the cards read the same number (R2).

import { visit } from 'unist-util-visit';

export const WORDS_PER_MINUTE = 200;
export const SECONDS_PER_FIGURE = 10;

/** Counts words and figures in an mdast tree. */
export function measure(tree) {
  // Count per text node: joining the whole tree into one string (as
  // mdast-util-to-string does) glues the last word of one block to the first
  // of the next. HTML is skipped, or the markup of inline figures would count.
  let words = 0;
  let figures = 0;
  visit(tree, (node) => {
    if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'code') {
      words += node.value.split(/\s+/).filter(Boolean).length;
    }
    if (node.type === 'image') figures += 1;
    if (node.type === 'html') {
      // A <figure> usually wraps an <img>; count the figure, not both.
      const f = node.value.match(/<figure\b/gi)?.length ?? 0;
      figures += f > 0 ? f : (node.value.match(/<img\b/gi)?.length ?? 0);
    }
  });
  return { words, figures };
}

/** Whole minutes, at least 1. */
export function minutesFor({ words, figures }) {
  const seconds = (words / WORDS_PER_MINUTE) * 60 + figures * SECONDS_PER_FIGURE;
  return Math.max(1, Math.ceil(seconds / 60));
}

export default function remarkReadingTime() {
  return (tree, file) => {
    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.minutesRead = minutesFor(measure(tree));
  };
}

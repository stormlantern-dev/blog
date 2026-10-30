# Reading time and a reading progress bar

- **Status:** Proposed
- **Date:** 2026-10-30
- **Tracking issue:** #57, which holds the test plan and the verification record

## Summary

Posts on this blog range from under 100 words to over 4,000. Nothing tells a
reader which kind they are opening, or, once inside a long one, how far they
have come. This adds two things: a reading-time estimate ("12 min read") on
each post and its card, computed when the site is built, and a thin progress
bar on post pages that fills as the reader moves through the article body,
done in CSS without JavaScript.

## Decision this enables

Whether to build both, and how: build-time estimate versus in-browser, and a
CSS-only bar that some browsers do not show versus a JavaScript bar that all
of them do.

## Goals

- **G1.** Before opening a post, a reader can tell a five-minute read from a
  twenty-minute one.
- **G2.** Inside a long post, a reader can see how much is left without
  reaching for the scrollbar.
- **G3.** Neither costs the reader anything: no JavaScript for the bar, no
  layout shift, no third-party request, nothing stored.

## Non-goals

- **Reading time for a whole series.** Each part shows its own. A series total
  needs series metadata the blog does not have.
- **Personalised reading speed**, or remembering where a reader stopped. That
  would mean storing something, which the privacy page promises not to do.
- **A table of contents, or "jump to section".** Separate idea, separate PRD.
- **Reading time in the RSS feed.** Feed readers show their own.
- **Analytics on how far people read.** The blog has no analytics, on purpose.
- **A progress bar on pages other than posts** (home, tags, 404).
- **A JavaScript fallback** for browsers without scroll-driven animations; see
  "What was ruled out".

## Constraints and evidence

- **Posts are Markdown and MDX** in `src/content/posts`, loaded through
  Astro's content collections (`src/content.config.ts`). Lengths measured
  2026-10-30 with `wc -w` on the post bodies: shortest 93 words
  (`2014-07-15-intellij-idea-13-sbt-support.md`), longest 4,128
  (`2026-11-16-the-model-never-writes-a-number-part-3.md`).
- **Astro documents a reading-time recipe**: a remark plugin using the
  `reading-time` package and `mdast-util-to-string`
  ([docs](https://docs.astro.build/en/recipes/reading-time/)). The value it
  sets is available after rendering an entry, not on the bare collection
  entry, which matters for the cards (R2).
- **`reading-time`** (npm, 1.5.0, MIT) defaults to 200 words per minute: its
  README says `wordsPerMinute` is "the words per minute an average reader can
  read (default: 200)".
- **CSS scroll-driven animations** (`animation-timeline`) per MDN's
  browser-compat-data 8.1.7 (2026-10-22): Chrome and Edge 115, Firefox 159,
  Safari and iOS Safari 26, none behind a flag. Older versions of these
  browsers show no bar (R4).
- **Brand.** BRAND.md in the design system restricts orange to interactive
  affordances and "in-progress" pills. A reading-progress bar is closest to the
  latter; R5 uses the accent colour on that basis.
- **The blog has a privacy page** stating it stores nothing but the theme
  choice. Nothing here may change that.

## What was ruled out

| Option | Why not |
|---|---|
| Computing reading time in the browser | Every visitor's browser would count the same words; the number is known at build time. It would also differ between card and page if one of them were not rendered. |
| Hand-written `readingTime` in frontmatter | Goes stale on every edit. |
| A JavaScript scroll listener for the bar | Works in older browsers, but adds script to every post for decoration, and scroll handlers are the classic source of jank. All current major browsers support the CSS version (see evidence), so the gap is old browser versions only. |
| Bar tied to the whole page's scroll | The comments and post navigation below the article would make the bar reach 100% long after the reader finished, or never on a long comment thread. |
| `<progress>` or `role="progressbar"` | Implies a task with a value a screen reader should announce. Reading position is already conveyed by the scroll position; the bar is decoration. |

## Requirements

Priorities use RFC 2119: **MUST**, **SHOULD**, **MAY**.

**R1 (MUST). An estimate per post, at build time.** Each post gets a reading
time in whole minutes, at least 1, from its body: prose and code count as
words at 200 words per minute (the `reading-time` default); each figure
(image or diagram) adds 10 seconds. Front matter does not count.

*Fit:* table tests of the estimator on fixed Markdown give the expected
minutes for prose only, prose with a fenced code block, prose with two
figures, and an empty body (1 minute).

**R2 (MUST). Shown where a reader decides.** The post page shows "N min read"
in its meta line next to the date. The post cards on the home page and the tag
pages show the same number. Card and page come from the same computation.

*Fit:* in the built site, every post's page and its card show the same number;
the built pages contain no script that computes it.

**R3 (MUST). A bar that follows the article body.** Post pages show a thin bar
fixed at the top of the viewport. It is empty while the top of the article
body is below the top of the viewport, and full when the end of the body
reaches the bottom of the viewport. The cover image, comments and post
navigation do not move it.

*Fit:* checked on the shortest and the longest post: empty at the top, full
exactly as the last paragraph comes into view, unchanged while scrolling
through comments.

**R4 (MUST). CSS only, nothing when unsupported.** The bar uses CSS
scroll-driven animations and no JavaScript. Where `animation-timeline` is not
supported, no bar is drawn and the page is otherwise identical.

*Fit:* the post page's scripts are unchanged by this work; with the feature
disabled (or in a browser without it), no bar element is visible and the
layout is the same.

**R5 (MUST). It costs the reader nothing.** The bar:
- causes no layout shift (it is out of flow);
- is hidden from assistive technology and in print;
- uses the design system's accent colour, readable against the header in
  light and dark;
- is at most 4 px tall, so it never covers text.

*Fit:* Lighthouse CLS 0 on a post page; `aria-hidden` on the bar; absent in
print preview; checked in light and dark.

**R6 (SHOULD). Reduced motion is respected.** The bar tracks scroll position
directly, so it never animates on its own; with
`prefers-reduced-motion: reduce` it has no transition at all.

*Fit:* inspection of the CSS; no `transition` applies under reduced motion.

**R7 (MAY). Reusable by the organisation site.** If the bar proves itself on
the blog, it MAY move into the design system so stormlantern.nl's project
pages can use it.

*Fit:* not required for this PRD to be implemented.

## Success

The blog has no analytics, by choice, so success is judged by its author:
after a month, the estimates on the series posts feel right to someone who
reads them through, and the bar is still there because it helps, not because
nobody removed it.

## Phasing

One phase. R1 and R2 are a remark plugin and two template changes; R3 to R6
are one component of a few lines of CSS. Both ship in one pull request.

## Open questions

- **Words per minute for technical prose.** 200 is the package default and
  suits general prose; code-heavy posts may read slower. Settled by the author
  reading two series posts with a timer after launch. Owner: the author.
- **Whether R7 is worth it.** Decided when the organisation site gets long
  pages.

## What would change this plan

- **A major browser drops or breaks scroll-driven animations**, or most
  readers turn out to use older versions: then the JavaScript fallback comes
  back on the table.
- **Posts start shipping with very long code listings**, where a word count
  stops meaning anything: then code should be counted differently, or not at
  all.

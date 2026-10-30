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
done in CSS without JavaScript. A second phase lets a reader who asks for it
have the blog remember where they stopped in a post, in their own browser.

## Decision this enables

Whether to build both, and how: build-time estimate versus in-browser, and a
CSS-only bar that some browsers do not show versus a JavaScript bar that all
of them do. For phase 2: whether, and how, to remember a reader's place
without needing a consent banner.

## Goals

- **G1.** Before opening a post, a reader can tell a five-minute read from a
  twenty-minute one.
- **G2.** Inside a long post, a reader can see how much is left without
  reaching for the scrollbar.
- **G3.** Neither costs the reader anything: no JavaScript for the bar, no
  layout shift, no third-party request, nothing stored unless the reader asks.
- **G4.** A reader who comes back to a long post can pick up where they
  stopped, if they asked the blog to remember.
- **G5.** A reader who would rather listen can use their browser's own
  read-aloud feature, and hears the post, not the site around it.

## Non-goals

- **Reading time for a whole series.** Each part shows its own. A series total
  needs series metadata the blog does not have.
- **Personalised reading speed.**
- **Remembering a reader's place without being asked.** Saving it for every
  visitor by default needs consent (see Constraints); the blog has no consent
  banner and should not need one. Phase 2 saves only after the reader turns
  it on.
- **Generated audio or a podcast feed.** Separate idea, tracked on #58. Here only the browsers' built-in read-aloud is in scope.
- **A "Listen" button built on the Web Speech API.** Voices differ per device,
  and some Chrome desktop voices are generated online, sending the text to
  Google, which conflicts with the privacy page.
- **Syncing a reading position across devices.** That needs an account and a
  server; positions stay in the one browser.
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
- **Storing anything in the browser falls under the cookie rule, even if it
  never leaves the device.** ePrivacy Directive art. 5(3) (in the Netherlands,
  Telecommunicatiewet art. 11.7a) covers storing information on, or reading it
  from, the visitor's device; the EDPB's Guidelines 2/2023 on the technical
  scope of art. 5(3) include local storage. Consent is not needed for storage
  strictly necessary for a service the visitor explicitly asked for; WP29
  Opinion 04/2012 gives user-interface preferences set by the user (for
  example by clicking a button) as an exempt case. The theme toggle works this
  way today. (Summarised from those sources; not legal advice, and not checked
  by a lawyer.)
- **The blog has a privacy page** stating it stores nothing but the theme
  choice, and only after a click. Phase 2 extends that page; it must not
  store anything before the reader turns the feature on.
- **The design system has no switch component.** It has `sl-button`; a toggle
  is a button with `aria-pressed`.
- **Browsers already restore the scroll position** on back/forward navigation
  and reload, without the site storing anything. Phase 2 is for a reader who
  closes the tab and comes back later.

## What was ruled out

| Option | Why not |
|---|---|
| Computing reading time in the browser | Every visitor's browser would count the same words; the number is known at build time. It would also differ between card and page if one of them were not rendered. |
| Hand-written `readingTime` in frontmatter | Goes stale on every edit. |
| A JavaScript scroll listener for the bar | Works in older browsers, but adds script to every post for decoration, and scroll handlers are the classic source of jank. All current major browsers support the CSS version (see evidence), so the gap is old browser versions only. |
| Bar tied to the whole page's scroll | The comments and post navigation below the article would make the bar reach 100% long after the reader finished, or never on a long comment thread. |
| Remembering the place automatically for everyone | Needs consent (see Constraints), and so a banner on a site that has none. |
| A global "remember my place" toggle in the header | The header is on every page, the feature only matters on posts (and on long ones), and the header already wraps on phones. A reader looks for this inside a long post, not in site chrome. |
| Jumping straight to the saved place on return | The page appears to jump on its own, and a reader who wanted the top has to scroll back. An offer to continue leaves the reader in control. |
| `<progress>` or `role="progressbar"` | Implies a task with a value a screen reader should announce. Reading position is already conveyed by the scroll position; the bar is decoration. |

## Requirements

Priorities use RFC 2119: **MUST**, **SHOULD**, **MAY**.

### Phase 1: reading time and the bar

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

Posts with a reading time under 3 minutes have no bar. Their body fits on a
screen or two and never covers the viewport, so a bar tied to it would start
part-filled: on the 93-word post it opened at 64% (measured 2026-10-30,
1200×800).

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

**R13 (SHOULD). Works with built-in read-aloud.** Post pages are read
cleanly by the browsers' own read-aloud and reader modes: Safari's "Listen to
Page", Edge's "Read aloud", Chrome's reading mode, and Firefox's Reader View
with Narrate. Reading starts at the post title and stops at the end of the
article body; the header, footer, post navigation, comments and the progress
bar are not read. Figures are read by their description. The reading-time
line from R2 may be read; the phase 2 toggle and link must not be read as
part of the text.

*Fit:* in each of the four, a listener hears the title, the body and the
figure descriptions, and none of the site chrome; checked on one post with
diagrams and code.

### Phase 2: remember my place

**R8 (MUST). Off until the reader turns it on.** Each post's meta line, next
to the reading time, has a "Remember my place" toggle (an `sl-button` with
`aria-pressed`). Off is the default. While it is off, nothing is read from or
written to browser storage for this feature.

*Fit:* in a fresh browser profile, visiting and scrolling posts leaves no
storage keys for this feature; after turning it on, one setting key and
per-post entries appear.

**R9 (MUST). One setting, for all posts.** Turning it on in one post turns it
on for every post in that browser. While on, the reading position in the
article body is saved per post as the reader scrolls, at most once a second.

*Fit:* turned on in post A, scrolled in post B; reopening B (after closing the
tab) offers B's position.

**R10 (MUST). Offer, don't jump.** On returning to a post with a saved
position, the page opens at the top as usual and shows a small link near the
meta line, "Continue where you left off (43%)". Following it scrolls to the
saved place; the link disappears once used or when the reader scrolls past
that point.

*Fit:* reopening a post with a saved position does not scroll by itself; the
link scrolls to within one paragraph of the saved place.

**R11 (MUST). Forget cleanly.** Turning the feature off deletes every saved
position and the setting. A position is forgotten when the post is read to the
end, and after 30 days without a visit. The privacy page says what is stored,
under which key, and how to clear it.

*Fit:* after turning it off, no keys for this feature remain; a post read to
the end has no saved position; an entry with a timestamp older than 30 days is
ignored and deleted on the next visit; the privacy page lists the key.

**R12 (MUST). Small, and only where needed.** The script is only included on
post pages, adds no dependency, and fails quietly where storage is blocked
(private modes, blocked site data): the toggle then works for this page and
says nothing is kept.

*Fit:* the script is absent from non-post pages; under 2 KB gzipped; with
storage blocked, no errors in the console.

## Success

The blog has no analytics, by choice, so success is judged by its author:
after a month, the estimates on the series posts feel right to someone who
reads them through, and the bar is still there because it helps, not because
nobody removed it.

## Phasing

1. **Reading time and the bar:** R1 to R6, and R13 (R7 optional). A remark plugin, two
   template changes and one component of a few lines of CSS; no JavaScript, no
   storage. Useful on its own.
2. **Remember my place:** R8 to R12. The only part with JavaScript and
   storage. Shipping it after phase 1 shows whether the bar alone already
   answers "how far am I", which decides whether phase 2 is worth it.

## Open questions

- **Words per minute for technical prose.** 200 is the package default and
  suits general prose; code-heavy posts may read slower. Settled by the author
  reading two series posts with a timer after launch. Owner: the author.
- **Whether R7 is worth it.** Decided when the organisation site gets long
  pages.
- **Whether phase 2 is needed at all.** Settled after phase 1 has been live
  for a few weeks: if the author never misses it on long series posts, it can
  be dropped. Owner: the author.
- **The 30-day expiry in R11.** A guess; long enough for a series published
  weekly.

## What would change this plan

- **A major browser drops or breaks scroll-driven animations**, or most
  readers turn out to use older versions: then the JavaScript fallback comes
  back on the table.
- **A regulator or court says user-enabled local storage of reading position
  still needs separate consent.** Then phase 2 is dropped.
- **Posts start shipping with very long code listings**, where a word count
  stops meaning anything: then code should be counted differently, or not at
  all.

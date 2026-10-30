---
title: "Nobody sets up alerts, part 1: configuration is where features go quiet"
date: 2026-11-23
summary: "My investing app could watch my portfolio and warn me, and in months it never sent a single alert, because nobody had set one up. What research says about settings and alarm fatigue, and what changed when setting up an alert became a conversation."
tags: [ux, llm]
draft: false
---

<!--
DRAFT. Prose rules, from the blog-post skill:
- Reader: engineers and product people. They do not know the app, its code
  or its repository. Explain every term the first time, in one plain
  sentence, or do not use it.
- No issue numbers, internal file names, paths or resource names.
- Nothing about holdings, amounts or the author's portfolio percentages.
- Usage claims only for what has actually happened (live since 27 Oct 2026).
- Research and vendor claims only with a checked primary source, linked.
- Stay vendor-neutral where the idea is the subject.
- The author is the only user. No customers, users or testers.
Outline: issue #64.
-->

# An alert system that never sent an alert

The small app that watches my brokerage account, the one from [The model never writes a number](/posts/2026-11-02-the-model-never-writes-a-number/), has been able to warn me about things for months. It knows four kinds of alert: a holding that moves more than some percentage in a day, a holding that grows past some share of the portfolio, a price that crosses a level, and important news about something I own.

Behind those sits a fair amount of machinery. Every hour a job checks each alert against the latest prices and news. Whatever matches goes to a language model, which scores how much it matters on a scale of one to ten, a step usually called triage. Only what scores high enough becomes a notification on my phone, and only once per alert per day.

In September I looked at the production database. The hourly job had run more than two thousand times, and every run had reported the same thing: nothing to check. There were no alerts set up. Not one notification had ever been sent.

Nothing was broken. The only way to set up an alert was a form on an admin page that asked for a rule type, a holding, a threshold and a time window, in the vocabulary of the code. I had written that form myself, and I had never filled it in.

This post is about why that happens, what research says about it (less than the folklore claims), and what changed when setting up an alert became a conversation. Part two, out on 30 November, is about the engineering: how a chat can change a configuration without ever being allowed to write it.

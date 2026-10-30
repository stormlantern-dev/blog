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

# Do people really never change their settings?

You may have heard that 95% of people never change a single setting. That figure goes back to a [blog post by Jared Spool](https://archive.uie.com/brainsparks/2011/09/14/do-users-change-their-settings/) about a study "back in the early days of PC computing". His team asked people to email in their Microsoft Word settings file, and "several hundred" did. "Less than 5% of the users we surveyed had changed any settings at all." It is a good story, but there is no write-up of the method and no date, and I could not find the Microsoft data it is often attributed to.

A better-documented study points the other way. In 1996, [Page and colleagues](https://chi1996.acm.org/proceedings/papers/Page/srp_txt.html) copied the settings of 101 WordPerfect users after 28 days of ordinary use, without telling them the study was about customisation. "A surprising 92% of the participants in this study did some form of customization of the software", on average 9.1 changes. But look at what they changed: toolbars and preferences, the things in their way every day. Only 4% touched the menus. The authors' advice was not "nobody configures". It was "Optimize default settings for casual users."

So people do configure, a little, and mostly when something gets in their way. For everything else, the product's choice wins. That is the default effect, and it is well measured: a [meta-analysis of 58 studies](https://ideas.repec.org/a/cup/bpubpo/v3y2019i02p159-186_00.html) with more than 73,000 participants found a sizeable effect (d = 0.68, between medium and large by the usual rule of thumb), with "substantial variation" between studies, some of which found none.

One study matters more than the others for an app about money. When a US company [started enrolling new employees in its retirement plan automatically](https://www.nber.org/papers/w7682), many of them kept both the default contribution and the default fund. The authors put that down partly to inertia, and partly to "many employees taking the default as investment advice on the part of the company". In an investing app, a suggested threshold is read the same way: as a recommendation. I will come back to that.

Alerts make all of this worse, because an empty list of alerts has no sensible default. The default is silence, and silence looks exactly like a quiet market.

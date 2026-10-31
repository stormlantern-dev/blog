---
title: "Nobody sets up alerts, part 1: configuration is where features go quiet"
date: 2026-11-23
summary: "My investing app could watch my portfolio and warn me, and in months it never sent a single alert, because nobody had set one up. What research says about settings and alarm fatigue, and what changed when setting up an alert became a conversation."
tags: [ux, llm]
draft: false
cover: /img/posts/nobody-sets-up-alerts/cover.png
coverAlt: "Isometric illustration on a dark navy grid. On the left, a grey control panel full of sliders, dials and switches, with a column of small unlit bells beside it. In the centre, a glowing teal speech bubble with a smaller reply bubble, and a trace running from them to the right. On the right, two bells on pedestals glow orange and coral, ringed with light, next to a blank card."
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

<figure class="d2-diagram" role="img" aria-label="A chain of four steps: your alerts, an hourly check against prices and news, triage that scores each match from 1 to 10, and a notification at most once a day. The first box, your alerts, is empty, so nothing flows to the rest.">
  <img src="/img/diagrams/nobody-sets-up-alerts-pipeline.svg" alt="" />
  <figcaption>Everything after the first step works. The first step is empty, so the hourly check has nothing to check, and nothing ever reaches triage or your phone.</figcaption>
</figure>

In September I looked at the production database. The hourly job had run more than two thousand times, and every run had reported the same thing: nothing to check. There were no alerts set up. Not one notification had ever been sent.

Nothing was broken. The only way to set up an alert was a form on an admin page that asked for a rule type, a holding, a threshold and a time window, in the vocabulary of the code. I had written that form myself, and I had never filled it in.

This post is about why that happens, what research says about it (less than the folklore claims), and what changed when setting up an alert became a conversation. Part two, out on 30 November, is about the engineering: how a chat can change a configuration without ever being allowed to write it.

# Do people really never change their settings?

You may have heard that 95% of people never change a single setting. That figure goes back to a [blog post by Jared Spool](https://archive.uie.com/brainsparks/2011/09/14/do-users-change-their-settings/) about a study "back in the early days of PC computing". His team asked people to email in their Microsoft Word settings file, and "several hundred" did. "Less than 5% of the users we surveyed had changed any settings at all." It is a good story, but there is no write-up of the method and no date, and I could not find the Microsoft data it is often attributed to.

A better-documented study points the other way. In 1996, [Page and colleagues](https://chi1996.acm.org/proceedings/papers/Page/srp_txt.html) copied the settings of 101 WordPerfect users after 28 days of ordinary use, without telling them the study was about customisation. "A surprising 92% of the participants in this study did some form of customization of the software", on average 9.1 changes. But look at what they changed: toolbars and preferences, the things in their way every day. Only 4% touched the menus. The authors' advice was not "nobody configures". It was "Optimize default settings for casual users."

So people do configure, a little, and mostly when something gets in their way. For everything else, the product's choice wins. That is the default effect, and it is well measured: a [meta-analysis of 58 studies](https://ideas.repec.org/a/cup/bpubpo/v3y2019i02p159-186_00.html) with more than 73,000 participants found a sizeable effect (d = 0.68, between medium and large by the usual rule of thumb), with "substantial variation" between studies, some of which found none.

One study matters more than the others for an app about money. When a US company [started enrolling new employees in its retirement plan automatically](https://www.nber.org/papers/w7682), many of them kept both the default contribution and the default fund. The authors put that down partly to inertia, and partly to "many employees taking the default as investment advice on the part of the company". In an investing app, a suggested threshold is read the same way: as a recommendation. I will come back to that.

Alerts make all of this worse, because an empty list of alerts has no sensible default. The default is silence, and silence looks exactly like a quiet market.

# Why alerts cannot run on defaults

The obvious answer is to ship good defaults: warn everyone about every holding that drops more than 5% in a day, and be done. The places that have lived with alerts the longest show why that fails.

Hospitals are full of alarms: monitors that beep when a heart rate, an oxygen level or a blood pressure leaves its range. In 2013 the Joint Commission, which accredits American hospitals, issued a [warning about alarm fatigue](https://digitalassets.jointcommission.org/api/public/content/f65e5c9df2b94000a99445e0a7877007). "It is estimated that between 85 and 99 percent of alarm signals do not require clinical intervention, such as when alarm conditions are set too tight; default settings are not adjusted for the individual patient or for the patient population". Staff who hear dozens of alarms that mean nothing learn to tune them out, including the one that does.

The same happens on screens. A [review of 17 studies](https://pmc.ncbi.nlm.nih.gov/articles/PMC1447540) found that doctors override drug-safety warnings in their prescribing software in 49% to 96% of cases, often for good reason. And [a study of 112 primary-care clinicians](https://pmc.ncbi.nlm.nih.gov/articles/PMC5387195/) found that the "likelihood of reminder acceptance dropped by 30% for each additional reminder received per encounter". Not over months, through slow numbing, but in the moment: the more reminders at once, the less each one counts.

Teams that run software in production learned the same lesson. Google's book on site reliability engineering puts it flatly: ["Every page should be actionable."](https://sre.google/sre-book/monitoring-distributed-systems/) A page is an alert that wakes someone up. "When pages occur too frequently, employees second-guess, skim, or even ignore incoming alerts." The book also advises alerting on symptoms, what the user would notice, rather than on every possible cause.

So alerts live in a narrow band. Too few, and you hear nothing; that is where my app started. Too many, and you stop listening. A threshold that is right for someone else is wrong for you: a 5% daily move is news for a bond fund and an ordinary Tuesday for a small biotech. The bar I set for my own alerts is that they should be *actionable: something where I might want to step in*. Only I can say what that means for what I hold.

The app's triage, the language model scoring each match, helps with the "too many" side. It cannot help with the other side, because it only judges what it was asked to watch. Alerts need personal settings. The question is not whether people should configure them, but how to make that cheap.

# How investing apps let you set up alerts

Three examples, each from the company's own documentation:

- [Robinhood](https://robinhood.com/us/en/support/articles/price-alerts/) has two systems. In the notification settings you choose whether moves in your holdings or watchlist alert you at 5% or at 10%. Separately, on a stock's chart, a bell lets you add "Price moves above" or "Price moves below" a price you type in.
- [TradingView](https://www.tradingview.com/support/solutions/43000474415), built for active traders, adds a condition builder, an expiry, channels such as email or a webhook, and a choice of how often an alert fires: "Once only", "Once per bar", "Once per bar close", or "Once per minute or every time".
- [Saxo's programming interface for price alerts](https://www.developer.saxo/openapi/referencedocs/vas/v1/pricealerts/post__vas__definitions) shows the model underneath: which price to watch, an operator, a target value, an expiry date, and a flag asking: "Is the alert only triggered once or will the alerts keep recurring until the alert expires".

From simple to professional, it is the same grammar: an instrument, a value to watch, a comparison and a number. Then how often, until when, and where to send it. The apps differ only in how much of that grammar they show you.

None of them asks what you want to know. That translation is left to you. "Tell me if one position gets too big a share of my portfolio" has to become an instrument, a variable, an operator and a value, in the system's words, before anything is watched. That is exactly the work the default effect predicts people will put off.

<figure class="d2-diagram" role="img" aria-label="At the top, what you want to know: is one position becoming too big a part of my portfolio. An arrow labelled 'you translate' leads to what the form asks: instrument ASML, value share of portfolio, comparison at least, number 35%, how often once or every time, until 31 December, where to send it, and a name for the notification.">
  <img src="/img/diagrams/nobody-sets-up-alerts-grammar.svg" alt="" />
  <figcaption>One question, eight fields. The translation from what you want to know into the form's terms is left to you.</figcaption>
</figure>

The grammar also hides a trap. "Tell me when it is above 200" can mean once, the moment it crosses 200, or every time it is checked while it stays above. Researchers call the first an event and the second a state, and a [study of if-this-then-that rules](https://hcrlab.cs.washington.edu/assets/pdfs/2015/huang2015ubicomp.pdf) found that people interpret the same rule inconsistently and make mistakes writing rules that mix the two. TradingView's frequency menu and Saxo's recurring flag are that same question, asked up front in the system's terms, before you have had a reason to care.

# What a conversation fixes, and what it does not

A conversation moves the translation to the other side. You say "tell me if anything drops more than 8% in a day", and the system works out which of its rule types that is. When you are vague, it asks. The Nielsen Norman Group, which studies usability, found in a [diary study of 425 conversations with AI chatbots](https://www.nngroup.com/articles/AI-conversation-types/) that many start when "the user starts with an underspecified, sometimes too vague query", and that "the bot can facilitate query articulation by asking the user helping questions". Is that once, or every day it stays down? On every holding, or one?

Chat interfaces have well-known weaknesses too. A text box does not show what it can do, which is why the first of Microsoft's [guidelines for human-AI interaction](https://www.microsoft.com/en-us/haxtoolkit/library/) is "Make clear what the system can do". And people often cannot put what they want into words. Writing about image generators, the same group calls this the [articulation barrier](https://www.nngroup.com/articles/ai-articulation-barrier/): users "lack the vocabulary to write the required prompt".

For alerts, a conversation turned out to answer both with one question: what would you recommend? When I asked, the app looked at what I hold and proposed up to three alerts that fit it: a warning if my largest position grows past a share I would want to know about, a daily-move threshold on the holding that moves most, news about anything I own. I did not need to know the rule types, or the words for them. And when a proposal would only repeat an alert I already have, it says so, instead of quietly setting up a second one that sends the same warnings twice.

Remember the retirement plan, though. A recommendation from an investing app reads as advice. So every suggestion arrives as a separate proposal, and none of them is active until I confirm it. Nothing is switched on as a batch.

What a conversation does not fix is precision. When you already know what you want, changing 8% to 7% or swapping one holding for another, a field is faster than a sentence. A [study that let people choose](https://par.nsf.gov/biblio/10295857) between a conversational agent and an ordinary app screen for the same tasks found them "choosing the conventional GUI more often for transactional and time-sensitive tasks". Microsoft's guidelines ask the same: "Support efficient correction".

Put side by side, they are good at different things:

<sl-table density="compact" stack>
<table>
<thead><tr><th></th><th>Conversation</th><th>Form</th></tr></thead>
<tbody>
<tr><th scope="row">Good at</th><td data-label="Conversation">Saying what you want in your own words; asking what is worth watching</td><td data-label="Form">Exact values; changing one detail</td></tr>
<tr><th scope="row">Weak at</th><td data-label="Conversation">Precision; showing what is possible, unless you ask</td><td data-label="Form">Turning what you want into fields; knowing which threshold makes sense</td></tr>
<tr><th scope="row">In this app</th><td data-label="Conversation">Finding out what to watch</td><td data-label="Form">Adjusting it</td></tr>
</tbody>
</table>
</sl-table>

So the form stayed, rewritten in plain language: holdings by name, a time window and an importance level as plain choices, and only the fields that matter for the kind of alert you picked. The conversation is for finding out what to watch. The form is for adjusting it. Neither replaces the other.

# The pattern the industry settled on

I am not the first to let people describe an automation in their own words. Two products that ship it today follow the same three steps.

In Google Home, [Help me create](https://support.google.com/googlehome/answer/15684131) takes a sentence such as "Turn on the lights at 7 AM every morning" and returns an overview of the automation it built. From there you can "Ask again" to rephrase, or "Continue" to review it: its starters, conditions and actions, each editable in the app's ordinary editor. Only "Save" creates it. An automation with errors can be saved, but only as inactive, and it "can't be activated until all errors are fixed".

Slack's Workflow Builder [does the same with workflows](https://slack.com/help/articles/32843655109395). You describe the workflow, Slack generates the steps, and you "add, remove, or edit steps" before you click "Finish Up", review the permissions and "Publish". Nothing runs before that.

The shape is the same in both:

1. **The model drafts, in the product's own structure.** Not a paragraph about what it would do, but the automation itself: starters, steps, conditions.
2. **You check it where you would check anything else.** In the same editor, in the same words, with the same controls for fixing a detail. That is Microsoft's "Support efficient correction" again: you change one field instead of rephrasing the whole request.
3. **A separate, deliberate step makes it real.** The model never flips the switch.

<figure class="d2-diagram" role="img" aria-label="Three steps from left to right. One: the model drafts it in the product's structure; Google Home shows an overview, Slack generated steps, this app a card. Two: you check it in the ordinary editor; Home's Continue, Slack's step editor, this app's form. Three: a separate step makes it real; Home's Save, Slack's Publish, this app's Confirm.">
  <img src="/img/diagrams/nobody-sets-up-alerts-pattern.svg" alt="" />
  <figcaption>The same three steps in Google Home, Slack's Workflow Builder and the app in this post.</figcaption>
</figure>

Each step answers one of the problems from earlier. The draft in the product's own structure is where an ambiguity such as "once, or every time?" becomes visible, as a field you can read. Checking it in the ordinary editor keeps the form's precision. And the separate step is what makes a suggestion a suggestion, rather than advice that has already been acted on.

# How I applied it

The first change had nothing to do with conversation. The app got an alerts page that shows, in plain sentences, what is being watched ("Tell me when any holding moves 8% or more in a day") and every alert that was sent, with the reason the triage gave. Before that page, the honest answer to "is anything watching my portfolio?" was a database query.

Then the conversation, under that list. You say what you want, or ask what it would recommend, and every change comes back as a card: the same sentence the list will show, and a Confirm button. Nothing is saved until you press it. The recordings below use an invented demo portfolio, not mine, with the real language model behind them.

<figure>
  <video data-autoplay controls loop muted playsinline preload="metadata" width="1100" height="1020" poster="/img/posts/nobody-sets-up-alerts/alert-chat-recommend-poster.jpg" aria-label="Screen recording of the alerts page.">
    <source src="/img/posts/nobody-sets-up-alerts/alert-chat-recommend.mp4" type="video/mp4" />
  </video>
  <figcaption>Asked "What would you recommend for my portfolio?", the chat proposes three alerts with a reason for each: one holding growing past 35% of the portfolio, a volatile holding moving 8% in a day, and important news. Confirming the first adds it to the list above, as the same sentence.</figcaption>
</figure>

It did not work that well the first time. Asked the general question, the model gave general advice; only a more specific question ("looking at what I hold…") got answers about the actual portfolio, and even then it described its recommendations instead of proposing them. The model had the data all along. What it lacked was an instruction to recommend from it, whatever the wording, and to put each recommendation on a card straight away. Most of the work in a feature like this is in that kind of instruction, and part two is about how to test it.

When it cannot do something, it says so. The app knows four kinds of alert, and an earnings date is not one of them:

<figure>
  <video data-autoplay controls loop muted playsinline preload="metadata" width="1100" height="1020" poster="/img/posts/nobody-sets-up-alerts/alert-chat-unmet-poster.jpg" aria-label="Screen recording of the alerts page.">
    <source src="/img/posts/nobody-sets-up-alerts/alert-chat-unmet.mp4" type="video/mp4" />
  </video>
  <figcaption>Asked to report earnings dates, the chat answers "I can't watch for that yet" and offers the closest thing it can do: an alert for important news about that holding.</figcaption>
</figure>

That sentence is fixed: the app adds it if the model leaves it out. And the request is kept. Every "I can't watch for that yet" adds a line to a list of things asked for and not available, which is a better guide to the next kind of alert than guessing.

For precision there is still the form, rewritten in the same plain language: holdings by name, the threshold, a time window and an importance level as plain choices.

<figure>
  <video data-autoplay controls loop muted playsinline preload="metadata" width="1100" height="1020" poster="/img/posts/nobody-sets-up-alerts/alert-form-adjust-poster.jpg" aria-label="Screen recording of changing an alert.">
    <source src="/img/posts/nobody-sets-up-alerts/alert-form-adjust.mp4" type="video/mp4" />
  </video>
  <figcaption>Changing one number: the concentration alert goes from 35% to 30% of the portfolio in the form, and the list shows the new sentence.</figcaption>
</figure>

# What I don't know yet

The conversation has been live since 27 October. That is a few weeks, with one person using it, and that person wrote it. It proves the feature can work; it does not prove the argument of this post.

<!-- DRAFT: Dirk, what is true in production since 27 Oct? E.g. how many alerts are set up, via chat or form, and has one been sent? Without that, this paragraph goes. -->
What I can say: the alerts page now lists alerts, which the database never did in the months before.

What would show I am wrong:

- **The alerts go quiet again.** If I stop opening the conversation after the first evening, it was a better setup wizard, not a better way to configure. That would still be worth having, but it is a smaller claim. The test is whether I come back to change something when the portfolio changes.
- **The alerts turn into noise.** Section three was about what happens when warnings outnumber the ones worth acting on. A recommended threshold that fires every other day is the same failure from the other side. The page shows every alert that was sent and why, so this one I will see.
- **The list of unmet requests stays empty.** It is meant to tell me which kind of alert to build next. If nothing lands there, either the four kinds cover what I want, or I have stopped asking.
- **The recommendations stay generic.** They are only as good as the instruction behind them, and a model update can change how it reads that instruction. Part two is about catching that before it ships.

None of this generalises past one person and one app. The research in the first half of this post does; the rest is a report of one attempt to act on it.

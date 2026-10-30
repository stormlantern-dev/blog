# Product requirements documents

A PRD records what should exist and why, so a decision can be made, or
revisited, by someone who was not in the conversation.

- **The PRD is the durable document.** Goals, non-goals, requirements with fit
  criteria, what was ruled out and why, and what would change the plan. Update
  it when the plan changes, and set its status.
- **The tracking issue holds the work.** Its test plan is the PRD's fit criteria
  as checkboxes, and it is closed only after a verification comment addresses
  each one. Pull requests refer to the issue (`Refers #N`), never close it.

Status is one of **Proposed**, **Accepted**, **Implemented** or **Superseded**
(with a link to what replaced it).

## Naming

`prd/<tracking issue number, zero-padded to four digits>-<slug>.md`. Open the
tracking issue first; its number is the PRD's number, so PRDs written in
parallel never collide.

| PRD | Status | Issue |
|---|---|---|
| [Reading time and a reading progress bar](0057-reading-time-and-progress.md) | Proposed | #57 |

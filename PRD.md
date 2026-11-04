# PRD â€” Payment Chase Board

**Status: DRAFT**

> **Read the open questions first.** Nothing below is safe to build until the thirteen questions in section 2 are answered. I have not picked an answer for any of them.

---

## 1. What was said, and what it means for the build

The idea, as written:

> "Payment chase board: One board where a home visit physio sees every patient whose money is still pending, whose session was missed, and whose feedback was never asked for. Each row carries the amount at risk in rupees. Marking a call as paid, promised or lost moves the row and changes the totals at the top. That is the whole page"

Each phrase, and what it actually commits us to:

**"Payment chase board"**
The product exists to move money from owed to collected. It is not a patient record, not a calendar, not a report. Its primary verb is *chase*, which means the same rows will be revisited day after day until they are resolved. Every design choice must make the next chase faster than the last.

**"One board"**
A single screen. No navigation, no tabs, no detail pages, no settings screen in the daily path. If a row needs more information, the row expands in place. If a number needs explaining, the explanation is on the board. This is the strongest constraint in the whole idea and it removes a great deal of scope by itself.

**"where a home visit physio"**
One solo practitioner working in patients' homes, not a clinic with staff and a billing desk. That user is standing, holding a phone, between two visits, often with one hand. The board must read at a glance on a small screen and must not need a desktop. [ASSUMPTION A1]

**"sees every patient"**
*Every* means complete, not a sample and not the first page. Nothing may be silently hidden by a default filter, and the board must state plainly when it is showing less than everything. This commits us to a clear "all rows" guarantee and an honest count.

**"whose money is still pending"**
There must be an amount owed per patient, and a clear boundary between owed and settled. The idea does not say where that amount comes from. It also does not say what happens when a patient owes for more than one visit or more than one package. This is an open question, not a design choice.

**"whose session was missed"**
A missed session is a distinct condition from money owed, and the idea lists it as a separate reason a patient appears on the board. That means the product needs to know a session was scheduled and did not happen. That fact has to come from somewhere, and the idea does not say where. It also does not say whether a missed session still creates a charge.

**"whose feedback was never asked for"**
Note the wording: *asked for*, not *received*. The row appears because nobody requested feedback, not because feedback was bad. That is a much easier fact to hold, but it still needs a record of whether a request was made. The idea does not say how that record is created or who creates it.

**"Each row carries the amount at risk in rupees"**
One money figure per row, in rupees, visible without opening anything. "At risk" is stronger than "owed": it implies the amount we could lose if this row is not chased. The idea does not define at-risk for a missed session or for a feedback-only row, where no money may be owed at all. This must be defined before the totals mean anything. [ASSUMPTION A2]

**"Marking a call as paid, promised or lost"**
Three outcomes, and only three. This tells us the unit of work is *a call*, not a visit and not an edit. It also tells us the physio records the outcome after the call, on the board. It does not tell us what happens to a row where no call was made, whether outcomes can be corrected, or whether a call can have more than one outcome over time.

**"moves the row"**
The row changes place as a direct result of the mark. Movement is the feedback that the action worked. That means the board is grouped or ordered in a way the physio can predict, and the physio must be able to see where the row went, or the movement will feel like the row vanished.

**"and changes the totals at the top"**
Totals are always visible, above the rows, and update the moment a mark is made. They are the scoreboard for the whole page. That means we need to agree exactly which totals exist before we build them, because a wrong total is worse than no total. [ASSUMPTION A3]

**"That is the whole page"**
No second page, and no hidden workflow behind the page. If something cannot be done from this one screen, it is out of scope for this version. This sentence is the scope boundary and I have treated it as one.

---

## 2. Check these first

These are the gaps and contradictions in the idea. Each one changes what gets built. I have not resolved any of them.

**Q1. Where does the money owed come from, and who keeps it current?**
The board shows amounts, so an amount must exist for each patient. The idea does not say whether the physio types it, imports it, or whether it comes from a booking record. If nobody maintains it, the board goes stale and the totals lie. **You must decide:** is the amount entered on this board, or does it arrive from somewhere else?

**Q2. What counts as a missed session, and does it still cost money?**
"Session was missed" is listed beside "money is pending", which suggests they are different reasons to appear. But a missed session is also usually a charge, or a lost charge. **You must decide:** does a missed session carry a rupee amount, and is that amount owed, lost, or both?

**Q3. Do missed sessions and feedback-only rows carry an amount at risk at all?**
The idea says every row carries an amount at risk. For a patient whose money is settled but whose feedback was never asked for, there may be zero rupees at risk. **You must decide:** do those rows show â‚¹0, show a different kind of value, or not appear on the money board at all?

**Q4. What is "at risk" measured against?**
Is it the full amount owed, the amount already overdue, or a judgement the physio makes? The totals at the top cannot be built until this is fixed. **You must decide:** which of those three is the number the board shows.

**Q5. Is there one row per patient, or one row per unpaid visit?**
The idea says every *patient*. But money is usually owed per visit or per package, and a patient can owe for several. **You must decide:** does a patient with three unpaid visits get one row with a combined amount, or three rows?

**Q6. Where does the board get "session scheduled and missed" and "feedback asked"?**
The board cannot know either without a record. The idea does not say whether the physio marks these on the board, or whether they already exist somewhere we must read from. **You must decide:** are these conditions entered here, or supplied to us?

**Q7. What happens to a row after the call, and what does "moves" mean exactly?**
Paid, promised and lost are three outcomes. Does paid leave the board or move to a settled area? Does promised move to a dated column? Does lost disappear or stay visible as a loss? **You must decide:** the destination of each of the three outcomes, and whether a row can ever come back from lost or paid.

**Q8. What happens when no call was made, or the call had no outcome?**
The only actions are the three marks. There is no "not reached", "wrong number", "will call again" or "undo". **You must decide:** whether a fourth state is needed for attempts that produced no decision, and whether a mark can be corrected after it is made.

**Q9. Is a "promised" payment tied to a date?**
A promise without a date cannot be chased later, and the board is a chase board. **You must decide:** whether a promise records when it was promised for, and what the board does when that date passes.

**Q10. Whose feedback, and what is the board supposed to do about it?**
The feedback column tells the physio that feedback was never asked for, but the board has no action for asking. **You must decide:** is this column only a flag, or must the physio be able to mark feedback as requested from this board? And is the target the patient's feedback, or a request for a review or referral?

**Q11. Does the physio work alone, and is there one board per person or one for the business?**
This changes who sees what and whether two people can mark the same row. **You must decide:** one user, or several.

**Q12. What is the time boundary on "still pending"?**
Money from last month and money from two years ago both qualify as pending. **You must decide:** whether the board shows everything ever owed or only a working window, and if a window, how long.

**Q13. What should happen on a day with no rows?**
"Every patient" can legitimately mean an empty board. **You must decide:** what the physio sees when there is nothing to chase, and whether that is a success state or a warning that data stopped arriving.

---

## 3. Who this is for

**Primary â€” the home visit physiotherapist who owns the practice.**
They take bookings themselves, keep the diary themselves, and collect the fee themselves. They are the person who currently discovers unpaid money at month end. They open this board at the start of the day, between visits, and after a call. Their job to be done: *"Show me everyone I still have to collect from, tell me how much is at stake, and let me record what happened in one tap so I can put the phone down."*

**Secondary â€” the person who makes the calls, if it is not the physio.**
Some practices have a family member or an assistant who does the chasing. They need the same board but may not know the clinical detail. [ASSUMPTION A4] Their job to be done: *"Give me the list and the amounts, and let me log the outcome without asking the physio anything."*

**Not a user â€” the patient.**
The patient never sees this board and is never messaged by it in this version. The board is an internal work surface.

**Not a user â€” anyone at month end doing accounts.**
There is no reporting surface here. If they need figures, that is a separate request.

---

## 4. Scope, locked

In this version, the product is exactly one board and does the following:

- Shows one row per patient, or per unpaid item, according to Q5 once answered, with the patient's name and a rupee amount at risk visible on the row.
- Makes clear on the row why the patient appears: money pending, session missed, feedback never asked, or more than one of these.
- Shows a small set of totals at the top of the page that recompute immediately after every mark. The exact totals are fixed by Q4 and Q7.
- Lets the physio mark a row as **paid**, **promised** or **lost** from the row, without leaving the page.
- Moves the row and updates the totals as soon as a mark is made.
- Lets the physio see, on the same page, where a moved row went.
- Shows the full set of rows without a hidden default filter, and states the count plainly.
- Works on a small phone screen, one-handed, with the amount and the three actions reachable without zooming.
- Survives a weak connection between visits without losing a mark. [ASSUMPTION A5]

---

## 5. Not building, and why

This is the list I will read back to the client.

- **Adding or editing patients here.** The board is a chase surface, not a patient register. Patient records enter from somewhere else. If the board also became the place to create patients, it would grow a second job and stop being one page.
- **Taking payments or sending payment links.** Out of scope for this version. This board records that money was collected; it does not collect it. Adding collection brings reconciliation, refunds and receipts, which is a different product.
- **Messaging patients from the board.** The board records a call outcome; it does not make the call or send the reminder. This keeps the board honest about what it knows: a human spoke to a human.
- **Scheduling or rescheduling visits.** A missed session is *detected* here, not fixed here. Rescheduling needs a calendar, and a calendar on the same page would break the one-page rule.
- **Recording clinical notes, diagnosis, or treatment plans.** This is a money board. Clinical data adds privacy obligations and noise the physio does not need while chasing.
- **Charts, trends, month-end reports, exports.** "That is the whole page" rules them out. Totals at the top are a glance, not a report.
- **Multi-clinic or team administration, roles and permissions.** Only if Q11 says the user is not a solo practitioner. Even then, it waits for a later phase.
- **Feedback collection from patients.** The board can flag that feedback was never asked; it does not ask. Patient-facing feedback is a separate journey.
- **Automated chasing or reminders.** No automatic messages, no escalations. Every row is moved by a human marking an outcome.
- **Customising the board, themes, layouts or columns.** One board, one layout. Customisation would double the surface and slow the first version.
- **Editing an amount by hand on the board**, unless Q1 says the amount is entered here.
- **History of every change per row.** Out of scope unless Q7 requires undo, in which case only the minimum undo is added.

---

## 6. Phasing

**Phase 1 â€” the board that tells the truth.**
The board shows every relevant row with names, reasons and amounts at risk, plus the totals at the top. Marking works and the row moves and totals change. One user, one phone, no messaging, no reports. This is the whole shipped promise.

**Phase 2 â€” the board that fits the physio's day.**
Only what Phase 1 proves is missing: the fourth attempt state if Q8 says it is needed, promise dates if Q9 says yes, and a feedback-requested mark if Q10 says yes. Nothing that adds a second page.

**Phase 3 â€” only if asked for.**
A second user, a longer history window, or a printable summary. All three are dependencies on answers to Q11, Q12 and the reporting exclusion in section 5.

---

## 7. Success metrics

Numbers chosen so the product can fail visibly. All are targets, not promises. [ASSUMPTION A6]

- **Every rupee is visible.** At the end of the first month, the sum of amounts at risk on the board equals the physio's own count of pending money, to within â‚¹0. A difference means the board is lying.
- **The daily read takes under 30 seconds.** A physio can open the board and know what to chase, from first glance to closing the phone, in under 30 seconds on nine days out of ten.
- **A mark takes under 5 seconds.** From the moment the call ends to the row moving, under five seconds, on a phone, in one hand.
- **No stale rows.** Fewer than 5% of rows sit untouched for more than 14 days.
- **Month-end surprise goes to zero.** Within two months, the physio reports no unpaid family discovered for the first time at month end.
- **The board is opened on most working days.** At least 4 working days a week, for four consecutive weeks.
- **Feedback flags get cleared.** At least half of the rows flagged "feedback never asked" are marked as asked within 14 days of appearing, if Q10 confirms that action exists.

---

## 8. Open dependencies

- **A decision on Q1 to Q13.** Every one of them changes what is built. This is the main dependency and it is on the client, not on us.
- **A definition of "at risk"** signed off in plain words, because the top totals are computed from it.
- **A source for amounts owed**, or a decision that the physio enters them here instead.
- **A source for session-attended and feedback-asked facts**, or a decision that these are marked here instead.
- **The physio's real working list**, anonymised, to check the board can show every row without a hidden filter and still read clearly. [ASSUMPTION A7]
- **Confirmation of the device used**, since the board lives on a phone between visits. [ASSUMPTION A1]
- **Agreement that the board is the only surface for this version**, so no request for a second page lands mid-build.

---

## Assumptions made in this document

Every one of these is a guess a real client would have told us. None is safe to build on without confirmation.

- **A1 â€” One solo physio, on a phone, between visits.** The idea says "a home visit physio" and "the whole page", so I assumed a single owner-operator and a small screen, used one-handed and briefly.
- **A2 â€” "Amount at risk" is one rupee figure per row and per patient's full exposure.** The idea says each row carries it but does not define it. I did not resolve it; I only used the phrase as a placeholder for a definition the client must give (Q4, Q5).
- **A3 â€” A small, fixed set of totals at the top.** The idea says "the totals at the top" without naming them. I assumed a handful, not an editable sheet, and left the exact set to be agreed after Q4 and Q7.
- **A4 â€” A possible second user who makes the calls.** The idea never mentions staff. I assumed the physio usually calls but that a family member or assistant may, and flagged it for Q11.
- **A5 â€” The board must tolerate weak signal.** Home visits happen in homes and stairwells, so I assumed marks must not be lost when the connection drops. This is a product requirement, not an engineering preference.
- **A6 â€” The numeric targets in section 7.** None were given. I picked round, checkable numbers (30 seconds, 5 seconds, 4 days a week, 14 days) so they can be argued with.
- **A7 â€” A real anonymised working list can be shared for checking.** Needed to prove "every patient" is actually readable. The idea does not offer one.
- **A8 â€” Rupees only, one currency, one country.** The idea says rupees, so I assumed no conversion and no second currency.
- **A9 â€” No patient-facing surface in this version.** The idea describes a page the physio uses. I assumed the patient never sees it, which also keeps the feedback column a flag rather than a message.
- **A10 â€” The board is a daily working surface, not a month-end tool.** I assumed the physio opens it most working days, which is what the success metrics are built on.

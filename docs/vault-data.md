# Vault data

- `src/lib/vault/entries.ts`: the public timeline on `/vault`, grouped by year and sorted by date. Year-only events use `datePrecision: "year"` (date `YYYY-01-01`), month-only events `"month"` (`YYYY-MM-01`). Every entry needs a source a reader can open, and summaries are written in our own words.
- `src/lib/vault/notes.ts`: Historian reference notes. Not shown on the timeline, but sent to Gemini with the timeline and member profiles. Used for smaller results, partnerships, investors, valuations, roster changes by year, and anything whose date or accuracy is uncertain (the note says so, and the Historian is told to repeat that).
- `src/lib/vault/stats.ts`: dated YouTube subscriber counts shown as markers in each year.
- `src/lib/vault/members.ts`: member profiles.

The November 2026 pass added 39 timeline entries (2010–2026) on top of the entries already on main, 25 notes and one subscriber stat (8.57M on Oct 21, 2023), mainly from the Wikipedia and My Favorite Things Wiki pages on FaZe Clan, with prizes and results checked against tournament coverage (ESL, SiegeGG, Esports Earnings and others).

Known source conflicts are recorded in the notes rather than guessed: Rug's join year (2012 vs early 2013), the ELEAGUE Premier year (Wikipedia's text says 2018; the event was October 2017), the Series A close (Dec 2019 vs Apr 2020), and founder real-name mix-ups on fan sites. The fan wiki's real names for past members are not used at all. Its subscriber and view counts are kept as dated snapshots in the notes, not as current figures.

`tests/vault/data.test.mts` checks ids, dates, categories, sources, member slugs and that every year 2010–2026 has at least one entry.

# Trainer Week UI Redesign

## Problem

The current trainer UI shows one week at a time in a vertical table (exercises as rows, sets as sub-rows). The trainer thinks in terms of multi-week progressions — the same exercise across weeks 3–8. There's a mismatch between the spreadsheet workflow and the UI.

There's also a bug: clicking "next week" past the last week, then canceling the CreateWeekDialog, leaves the user on a non-existent week URL.

## Design

Two views on the same route, driven by the `?week=` query param:

### View 1: Multi-Week Overview (default — no `?week=` param)

The default landing page for `/trainer/athletes/[athleteId]`. Shows all days stacked vertically, each as a horizontal grid.

**Layout per day:**

| Bloque | Ejercicio | Sem 3 (19/01) | Sem 4 (26/01) | Sem 5 (02/02) | ... |
|--------|-----------|---------------|---------------|---------------|-----|
| A1     | Saltos 70 🛈 | 3-3-3 | 3-3-3 | 4-4-4 | ... |
| A2     | Slam ball 🛈 | 4-4-4 | 4-4-4 | 5-5-5 | ... |
| B1     | PM trap 🛈   | 60/5 - 85/4 - 100/2-2-2 | ... | ... | ... |

**Cell formatting (compact notation):**
- Bodyweight: `3-3-3`
- Weighted, same weight: `100/8-8-6`
- Weighted, mixed: `60/5 - 85/4 - 100/3-3-2` (group consecutive same-weight)
- Timed: `3x40s` or `3x50s`
- Per-side: append `c/l` (e.g. `8-8-6 c/l`)

**Interactions:**
- Week column headers clickable → navigate to `?week=N` detail view
- 🛈 icon on exercises with comments → tooltip on hover
- Block groups separated by subtle top border
- First two columns (Bloque + Ejercicio) sticky; table horizontally scrollable
- Day header shows label + warmup note as muted subtext

**Header:** `[← Back] Toni [+ Semana]`

### View 2: Single-Week Detail (`?week=N`)

Editable view for a specific week. All days stacked vertically.

**Layout per day:**

| Bloque | Ejercicio | Serie 1 | Serie 2 | Serie 3 | Serie 4 | Serie 5 |
|--------|-----------|---------|---------|---------|---------|---------|
| A1     | Saltos 🛈 | [4]     | [4]     | [4]     |         |         |
| A2     | Slam b 🛈 | [5]     | [5]     | [5]     |         |   [+][-]|
| B1     | PM trap 🛈| [60/5]  | [85/4]  | [100/3] | [100/3] | [100/2] |
| B2     | Sent.b. 🛈| [15/6]  | [25/5]  | [35/6]  | [35/6]  | [35/4] [+][-]|

**Each cell:** Two inputs stacked — weight (top, hidden if bodyweight) + reps (bottom).

**Block series controls:** `[+]` / `[-]` buttons at the end of each block's last exercise row. Adds/removes a series for all exercises in the block.

**Saving:** Track edits in local state. "Guardar cambios" button at bottom.

**Header:** `[← Overview] Toni — Semana 5 (02/02) [← Sem 4] [Sem 6 →]`

### CreateWeekDialog Changes

- Triggered by `[+ Semana]` button on the overview (not by URL)
- Auto-calculates sourceWeek (latest) and targetWeek (latest + 1)
- Cancel just closes the dialog (no navigation)
- Create closes dialog + revalidates (new column appears in overview)
- Bug eliminated: no more navigating to non-existent week URLs

### Data Layer

**New query: `getAthleteOverview(athleteId)`**
- Returns all weeks grouped by day
- Structure: `{ athlete, days: [{ dayIndex, label, notes, weeks: [{ weekNumber, weekStartDate, blocks }] }] }`

**Existing `getAthleteWeek`:** Stays for detail view. Add `durationSeconds` and `repsPerSide` to set data.

**New action: `updateBlockSeriesCount(blockId, newCount)`**
- Adds/removes sets from all exercises in a block

### Existing WeekTable

Keep for athlete-facing readonly view. Only trainer views change.

## Devices

Primary: desktop/laptop. Mobile is secondary.

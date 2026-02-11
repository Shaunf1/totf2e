# Thrill of the Fight 2 — Swiss Tournament Prototype

A clickable HTML/CSS/JS UI mock for an automated **Fight Night** tournament system, designed to match the in-game tablet UI style of *Thrill of the Fight 2*.

## How to Run

1. Open `index.html` in any modern browser (Chrome, Firefox, Edge).
2. No server or build step required — everything is vanilla HTML/CSS/JS with local fake data.

## Screens & Navigation

| Screen | How to reach it |
|---|---|
| **Events Hub** | Click "Tournaments" in the left sidebar. Default view. |
| **Event Tabs** | Use the Upcoming / My Events / Leaderboards / How It Works pill tabs. |
| **Tournament Lobby** | Click any event card → see registered fighters, countdown, and register/withdraw. |
| **Round Screen** | When tournament state is Round 1–3, click "View Rounds" or open event → pairing cards with "Join Match". |
| **Results/Standings** | When tournament state is Completed, click the event → final placement table + points breakdown. |
| **Leaderboard** | Use the "Leaderboards" tab → regional ranking with player profile drawer (click any row). |

## Dev Controls

A persistent panel pinned to the bottom of the screen (click **DEV CONTROLS** to collapse/expand):

| Control | What it does |
|---|---|
| **Tournament State** | Moves the tournament through: Scheduled → Registration Open → Closed → Confirm Window → Round 1/2/3 → Completed |
| **User State** | Sets the local player's registration status: Not Registered / Registered / Confirmed / Dropped |
| **Round 1/2/3 Result** | Choose Win, TKO Win, Loss, TKO Loss, or Pending for each round |
| **Apply & Refresh** | Applies all selections and re-renders the current screen |

### Suggested walkthrough

1. Start on Events Hub → click the first event to enter the Lobby.
2. Set **Tournament State** → `Confirm Window` → notice the red confirm banner.
3. Set to `Round 1` → click "View Rounds" → see pairings.
4. Set Round 1 result to "TKO Win", Round 2 to "Win", Round 3 to "Loss".
5. Set state to `Round 2`, then `Round 3` to see updated records per round tab.
6. Set state to `Completed` → click "View Results" → see standings + points breakdown.
7. Back on Events Hub, try the Leaderboards tab → click a player to open the profile drawer.

## Tournament Rules (implemented in prototype)

- **Format:** Fight Night, 8 players, 3 rounds, 3 fights guaranteed, no elimination.
- **Seeding:** Round 1 uses pure Ranked ELO (1v8, 2v7, 3v6, 4v5).
- **Pairing:** Rounds 2–3 pair players with similar records, avoiding rematches.
- **Scoring:** Placement points (1st=100, 2nd=75, 3rd=55, 4th=40, 5th–8th=25) + Undefeated bonus (+10 for 3-0) + TKO bonus (+10 per TKO win).

## Files

```
index.html   — Main page structure (all screens)
style.css    — TOTF2-matched visual styling
app.js       — Navigation, fake data, Swiss engine, scoring, dev controls
assets/      — Reference screenshots (optional, loaded if present)
```

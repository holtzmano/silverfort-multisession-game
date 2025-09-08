# Multisession Shape/Color Grid Game (React + Node + TypeScript)

A real-time, single-instance web game. All open tabs/devices share **one** game state.

- Board: **3 rows × 6 columns**
- Shapes: **Triangle, Square, Diamond, Circle**
- Colors: **Red, Green, Blue, Yellow**
- On click: **both** shape **and** color change
- New shape/color must **not** match any **orthogonal** neighbor (↑ ↓ ← →)
- +1 score per valid move
- If the clicked cell has **no valid (shape,color) pair** → **Game Over**
- Clicked cell enters **3-turn cooldown**

## Tech Stack
- **Client:** React + TypeScript + Vite, SVG for shapes
- **Server:** Node.js + TypeScript + Express + Socket.IO
- **(Optional) Persistence:** JSON file `server/leaderboard.json` for top scores (atomic write)

## Run Locally

### Server
```bash
cd server
npm install
npm run dev
```

* Default: `http://localhost:4000`
* Health: `http://localhost:4000/health` → `{ status, version, uptimeSec }`

**Optional CORS override:**

```bash
CLIENT_ORIGINS=http://localhost:5173,http://127.0.0.1:5173 npm run dev
```

### Client

```bash
cd client
npm install
npm run dev
```

* Default: `http://localhost:5173`

## Gameplay & Rules (server-enforced)
* Initial board: no orthogonal neighbors share **shape or color**
* On click: both shape **and** color change; must avoid all orthogonal neighbors
* If no valid pair exists → **Game Over** (broadcast to all clients)
* **Cooldown:** clicked cell shows a badge (3→2→1→0) and is unclickable during cooldown
* **Multisession:** all tabs/devices see the same state in near real-time (Socket.IO)

## Game Over UX
* The clicked losing cell is outlined in **red** ("No move")
* Its orthogonal neighbors (blockers) are outlined in **orange dashed**
* A **reason panel** lists adjacent sets and **Allowed shapes/colors** (empty list makes the cause obvious)
* Board remains visible and disabled until **Reset**

## Leaderboard
* After Game Over, enter a nickname (or leave blank → **Oren**) and **Save Score**
* Click **Leaderboard** to see **Top 10** with name, score, and time
* **Optional persistence:** scores saved to `server/leaderboard.json`

## Accessibility & UX
* High-contrast text in the leaderboard & controls
* `role="grid"` / `role="gridcell"` for the board and cells
* `aria-live="polite"` on the score
* Keyboard focus outlines enabled

## Project Structure

```
/client
  src/components/ShapeIcon.tsx
  src/useGame.ts
  src/App.tsx
/server
  src/game.ts
  src/index.ts
  leaderboard.json   # created at runtime if persistence enabled
README.md
```

## Scripts
* **server:** `npm run dev` (tsx watch), `npm run build`, `npm start`
* **client:** `npm run dev` (Vite), `npm run build`, `npm run preview`

## Manual Test Plan
1. Start **server** and **client** (see above).
2. Open the client in **two tabs**. Click a cell in one tab → both tabs update (score/board/cooldowns).
3. Play until **Game Over** → losing cell (red), blockers (orange), reason panel shows **Allowed** lists.
4. Enter nickname and **Save Score** → open **Leaderboard** and see your entry.
5. **(Persistence check)** Restart server → open Leaderboard → entry persists.

## Notes / Assumptions
* Orthogonal adjacency only (no diagonals)
* Single in-memory game instance on the server
* No authentication/sessions (intentionally)

## Known Limits & Future Work
* No per-user statistics; single shared score
* Minimal error surfacing 
* Could deploy client/server and set `CLIENT_ORIGINS` appropriately
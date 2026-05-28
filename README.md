# ♠ Poker Web Game

Full-stack multiplayer poker — Texas Hold'em and Pot-Limit Omaha. Create a room, share the code, and play live with up to 8 players.

![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react) ![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js) ![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socket.io) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss)

## 🔗 [Play it → poker-web-game.onrender.com](https://poker-web-game.onrender.com)

No install needed. Works on desktop and tablet.

> **Note:** Hosted on Render's free tier — the first load after inactivity may take ~30 seconds to wake up.

---

## What it does

- Host creates a room and gets a **6-character room code** to share
- Players join by entering the code — no accounts needed
- Host sets each player's name and starting chip stack individually
- Choose **Texas Hold'em** or **Pot-Limit Omaha** before the game starts
- Vote mid-session to switch game modes — majority rules, takes effect next hand
- **2–8 players** per room

---

## Gameplay

| Feature | Details |
|---|---|
| Texas Hold'em | 2 hole cards, standard betting rounds |
| Pot-Limit Omaha | 4 hole cards, must use exactly 2 + 3 community cards |
| Actions | Fold · Check · Call · Raise · All-In |
| Blinds | Small blind & big blind, rotating each hand |
| Side pots | Handled automatically for all-in situations |
| Hand evaluation | Powered by `pokersolver` — full showdown with hand descriptions |

---

## Themes

Toggle between two visual themes at any time using the button in the top-right corner:

| Theme | Look |
|---|---|
| 🎰 Classic | Green felt table, warm casino lighting |
| ⚡ Modern | Dark background, neon accents |

Theme preference is saved in `localStorage`.

---

## Chat & reactions

- Live in-game chat between all players
- Quick emoji reactions: 👏 😂 😱 🃏 🤑 😤 💀 🎰

---

## Admin mode

Hidden observational overlay for hosts or referees — no visible button anywhere.

1. Press **Ctrl + Shift + A** to open the password prompt
2. Enter the password (set in `server/config.js`, default: `secret.sesh.11`)
3. A collapsible side panel appears showing:
   - Every player's hole cards (face-up, labeled by name)
   - Upcoming community cards not yet revealed
   - Full deck order for the current hand

Admin mode is read-only and does not affect gameplay. Authentication is verified server-side.

---

## Privacy & security

- All game logic runs **server-side only** — other players' cards are never sent to your browser
- Admin panel is invisible in the UI; no hints in client code or console logs
- Admin password lives only in `server/config.js` — never exposed to the client

---

## Run locally

You'll need **Node.js 22+**.

```bash
git clone https://github.com/tommyhanono/Poker-Web-Game.git
cd Poker-Web-Game
```

**Start the server:**
```bash
cd server
npm install
node index.js
# Runs on http://localhost:3001
```

**Start the client (new terminal tab):**
```bash
cd client
npm install
npm run dev
# Runs on http://localhost:5173
```

Open **http://localhost:5173** — create a room and share the code with friends.

---

## File structure

```
poker-app/
├── server/
│   ├── config.js        — Admin password & game constants
│   ├── gameEngine.js    — Dealing, betting, hand evaluation
│   ├── roomManager.js   — Socket.io events, room & player state
│   └── index.js         — Express + Socket.io entry point
└── client/src/
    ├── App.jsx                    — Root, session persistence, routing
    ├── socket.js                  — Socket.io client singleton
    ├── components/
    │   ├── Lobby.jsx              — Create / join room
    │   ├── WaitingRoom.jsx        — Pre-game lobby, player setup
    │   ├── GameTable.jsx          — Main table layout
    │   ├── PlayerSeat.jsx         — Per-player card display & badges
    │   ├── ActionBar.jsx          — Fold / Check / Call / Raise / All-In
    │   ├── HandResults.jsx        — Showdown overlay & game mode vote
    │   ├── ChatPanel.jsx          — Live chat + emoji reactions
    │   ├── AdminPanel.jsx         — Hidden admin overlay (Ctrl+Shift+A)
    │   └── ThemeToggle.jsx        — Classic / Modern theme switcher
    └── utils/
        └── cards.jsx              — Card parsing & display component
```

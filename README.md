# 🎭 Imposter Live

A real-time multiplayer social deduction game for friends in the same room. Everyone gets the same secret word except one player — the **Imposter** — who has to bluff, survive the discussion, and avoid getting voted out.

🌐 **Live:** https://imposter-live.vercel.app

## ✨ Features

- Real-time rooms with shareable 6-character codes
- 3–12 players per room
- Up to 20 active demo rooms
- 7 themes with 100 cards each — 700 cards total
- Server-side secret-word and Imposter assignment
- Custom round timer from 30 seconds to 15 minutes
- Vote at any time and change your vote until the round closes
- Automatic round completion when everyone votes or time expires
- End-of-round Imposter + secret-word reveal
- Persistent scores across rounds
- Fairer Imposter rotation between players
- Mobile-first responsive UI

## 🃏 Themes

- Popular People
- Mixed
- Movies
- Tollywood Movies
- Tollywood Actors
- Animals
- Movies & TV Shows

## 🛠 Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Supabase Postgres + RPC functions
- **Realtime:** Supabase Realtime
- **Hosting:** Vercel

## 🔐 Game Security

The secret word is never exposed to the Imposter's client during an active round. Players receive only the information required for their own role through server-side RPC functions. Raw game tables are protected with Row Level Security.

The Supabase publishable key used by the browser is intentionally public; no service-role or private database credentials are included in this repository.

## 🚀 Local Development

Clone the repository:

```bash
git clone https://github.com/Rishikeshsanin/Imposter-Live.git
cd Imposter-Live
```

Run a simple local server:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## 🗄 Database

The database setup is stored in:

```text
supabase/migrations/001_imposter_live.sql
```

It contains the schema, 700-card library, room/game RPC functions, realtime setup, RLS configuration, and supporting indexes.

## 🎮 How to Play

1. One player creates a room and shares the code.
2. At least two more friends join.
3. The host chooses a theme and timer and starts the round.
4. Everyone checks their private role.
5. Discuss, bluff, accuse, and vote whenever you want.
6. When voting closes, the Imposter and secret word are revealed.
7. Scores update and the host can start the next round.

---

Built for chaotic game nights. 👀

# 🏆 ChoreQuest
### *Gamified Family Chore, Routine & Task Management for Home Assistant.*

[![Home Assistant Add-on](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)](https://www.home-assistant.io/)
[![Version](https://img.shields.io/badge/version-2.3.0-indigo.svg)](https://github.com/filidam89/chore-quest-addon)
[![Arch](https://img.shields.io/badge/arch-amd64%20%7C%20aarch64%20%7C%20armhf%20%7C%20armv7%20%7C%20i386-orange.svg)](https://github.com/filidam89/chore-quest-addon)

---

## 🌟 Overview

**ChoreQuest** is an advanced, gamified chore, routine, and task management system built specifically for **Home Assistant OS**. It transforms daily household chores into an engaging, collaborative experience for the entire family.

Runs **100% locally 24/7 inside Home Assistant OS**, with seamless integration via Ingress, customizable Lovelace dashboards, and deep sensor synchronization with Home Assistant.

---

## 📱 Core Features

### 1. ⚡ Spontaneous Tasks (Categorized by Area)
- Grouped into distinct sections (**Bucato & Panni**, **Cucina & Pasti**, **Pulizia & Casa**, etc.) according to your custom order.
- One-tap logging with support for **Material Design Icons (MDI)** (washing machine, iron, vacuum, stove, coffee maker, etc.) and emojis.
- Prominent icons, point allocations, priority tags, and last execution history.

### 2. 🔄 Recurring Routines & Promemoria
- Interval tracking in days (from last completion or fixed calendar schedule).
- Pre-warning alerts with overdue counters (**🔴 Overdue**, **🟡 Warning**, **🟢 OK**).
- Personal task support (0 points, excluded from leaderboard/stats).

### 3. 🎲 ADHD Dice Task Picker (Roulette delle Faccende)
- Weighted random task picker prioritizing neglected or overdue chores while still keeping recent ones in the pool.
- Guaranteed distinct task on every re-roll.

### 4. 📋 Single Tasks, Notes & Date Rescheduling
- Instant task assignments to specific members or the entire family.
- Interactive notes with chronological timestamps and authors.
- Secure deletion with explicit confirmation and audit logging in history.

### 5. 🏆 Unified Leaderboard, Charts & Activity Breakdown
- Live podium, rankings, and automated merit badges.
- Filtering by Today, 7 Days, Month, Year, and All-Time.
- Detailed task contributor breakdowns (e.g. *30 times: 18 by Dad [60%], 12 by Mom [40%]*).

### 6. 🌙 Dark / Light / Auto Theme Sync
- Full dark theme matching Home Assistant's dark mode aesthetics.
- Real-time automatic synchronization with Home Assistant and system preferences.

### 7. 💾 Backup & Restore System
- One-click JSON backup download.
- Full snapshot restoration from file.
- Default catalog re-seeding tool.

---

## 📡 Home Assistant Sensors (Live Sync via Supervisor API)

ChoreQuest publishes rich real-time entities and binary sensors to Home Assistant:

| Entity ID | Type | Description |
| :--- | :--- | :--- |
| `sensor.chorequest_<member>_points` | Sensor | Member points, rank, gap, daily/weekly/monthly points, badges, last activity |
| `sensor.chorequest_<member>_pending_tasks` | Sensor | Pending tasks count for this member, exclusive & shared breakdown, full task objects |
| `sensor.chorequest_leaderboard` | Sensor | Current #1 Leader, daily/weekly/monthly winners, full leaderboard list |
| `sensor.chorequest_due_routines` | Sensor | Total routines needing attention (Overdue + In Scadenza) |
| `sensor.chorequest_overdue_routines` | Sensor | Count and list of specifically overdue routines |
| `sensor.chorequest_warning_routines` | Sensor | Count and list of routines approaching due date |
| `sensor.chorequest_pending_tasks` | Sensor | Total household pending single tasks count with detailed task list |
| `binary_sensor.chorequest_all_chores_done` | Binary Sensor | `on` when **all routines are in order (no overdue tasks)**, `off` otherwise |
| `binary_sensor.chorequest_has_overdue` | Binary Sensor | `on` when overdue routines are detected (`device_class: problem`) |
| `sensor.chorequest_summary` | Sensor | Concise household status summary for notifications and dashboards |

---

## 🚀 Installation Guide (Home Assistant OS)

1. In Home Assistant, navigate to **Settings (Impostazioni)** ⚙️ ➔ **Add-ons**.
2. Click the **Add-on Store (Store degli Add-on)** button in the bottom right corner.
3. Click the **top-right three dots (⋮)** ➔ **Repositories**.
4. Add the repository URL:
   ```text
   https://github.com/filidam89/chore-quest-addon
   ```
5. Find **ChoreQuest** in the Add-on Store list and click **Install**.
6. Enable:
   - ✅ *Start on boot (Esegui all'avvio)*
   - ✅ *Show in sidebar (Mostra nella barra laterale)*
7. Click **START (Avvia)**!

---

## 🔒 Privacy & Persistence

* **100% Local:** No cloud or external accounts required.
* **Persistent Storage:** Saved in `/data/family_punti.json` across container restarts and updates.
* **Supervisor Integration:** Automatically connects to Home Assistant Core via Supervisor API.

---

## 📄 License

MIT License © 2026 ChoreQuest

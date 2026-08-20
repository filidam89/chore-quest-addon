# 🏆 ChoreQuest
### *Gamified Family Chore, Routine & Task Management for Home Assistant.*

[![Home Assistant Add-on](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)](https://www.home-assistant.io/)
[![Version](https://img.shields.io/badge/version-1.1.0-indigo.svg)](https://github.com/filidam89/chore-quest-addon)
[![Arch](https://img.shields.io/badge/arch-amd64%20%7C%20aarch64%20%7C%20armhf%20%7C%20armv7%20%7C%20i386-orange.svg)](https://github.com/filidam89/chore-quest-addon)

---

## 🌟 Overview

**ChoreQuest** is a modern, gamified chore and routine management Add-on for **Home Assistant OS**. It transforms daily household chores into an engaging, collaborative experience for the entire family.

Runs **100% locally 24/7 inside Home Assistant OS**, with instant access via the Home Assistant sidebar (Ingress) or from any browser, wall tablet, or smartphone.

---

## 📱 Features

### 1. 📱 Daily Family Mode (Kiosk & Mobile)
- **⚡ Spontaneous Tasks:** Quick one-tap logging for daily chores (Laundry, Dishes, Cooking, Trash, Grocery).
- **🔄 Recurring Routines:** Automatic interval tracking for periodic chores (Bedsheets, Vacuuming, Deep Cleaning) with last-run history.
- **📌 Inter-Member Assignments:** Assign chores directly between family members and earn points upon completion.
- **🏆 Live Podium & Badges:** Weekly leaderboard, monthly stats, and automated badges (👑 *Weekly Champion*, ⭐ *Super Helper*, 🏆 *Home Master*).

### 2. ⚙️ Admin & Management Mode
- **👥 Member Management:** Add/edit/delete family members with custom emoji avatars and badge colors.
- **⚡ Task Catalog:** Customize spontaneous task catalogs and points.
- **🔄 Routine Catalog:** Configure recurring routines and day intervals.

---

## 📡 Home Assistant Sensors (Live Sync)

ChoreQuest automatically publishes real-time sensors to Home Assistant:
* `sensor.family_<member_name>_points`: Weekly points, monthly points, total points, rank, and earned badges.
* `sensor.family_leaderboard`: Current rank #1 leader and leaderboard data.

---

## 🚀 Installation Guide (Home Assistant OS)

> ⚠️ **Important:** ChoreQuest is an **Add-on** (not a HACS integration). Install it from the official **Home Assistant Add-on Store**:

1. In Home Assistant, go to **Settings (Impostazioni)** ⚙️ ➔ **Add-ons**.
2. Click the **Add-on Store (Store degli Add-on)** button in the bottom right corner.
3. Click the **top-right three dots (⋮)** ➔ **Repositories**.
4. Paste the repository URL:
   ```text
   https://github.com/filidam89/chore-quest-addon
   ```
5. Click **Add (Aggiungi)** and then **Close**.
6. Find **ChoreQuest** in the Add-on Store list.
7. Click **Install**.
8. Enable:
   - ✅ *Start on boot (Esegui all'avvio)*
   - ✅ *Show in sidebar (Mostra nella barra laterale)*
9. Click **START (Avvia)**!

---

## 🔒 Privacy & Persistence

* **100% Local:** No cloud or external accounts required.
* **Persistent Storage:** Saved in `/data/family_punti.json` across reboots and updates.
* **Zero Configuration:** Automatically connects to Home Assistant Supervisor internally.

---

## 📄 License

MIT License.
